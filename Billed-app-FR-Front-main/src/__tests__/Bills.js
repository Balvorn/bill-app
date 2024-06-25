/**
 * @jest-environment jsdom
 */
import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";
import userEvent from '@testing-library/user-event'
import "@testing-library/jest-dom/dist/extend-expect";

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {

    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains('active-icon')).toBeTruthy()
    })

    describe("When I click on eye icon", () => {
      test("Then a modal should open", () => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))

        document.body.innerHTML = BillsUI({ data: bills })

        const store = null

        const bill = new Bills({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
        });

        const btns = screen.queryAllByTestId('icon-eye')
        const btn = btns[0]
        const handleClickEye = jest.fn(bill.handleClickIconEye(btn));
        btn.addEventListener('click', handleClickEye);
        userEvent.click(btn);
        expect(handleClickEye).toHaveBeenCalled();

        const modal = screen.getByRole('dialog', { hidden: true })
        expect(modal).toBeTruthy()
      })
    })

    describe("When I click on new bill", () => {
      test("Then I should be sent to newBill", () => {

        document.body.innerHTML = BillsUI({ data: bills })

        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
  
        const store = jest.fn();
  
        const bill = new Bills({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
        });

        const btn = screen.getByTestId('btn-new-bill')
        const handleClickNewBill = jest.fn(bill.handleClickNewBill());
        btn.addEventListener('click', handleClickNewBill)
        userEvent.click(btn)
        expect(handleClickNewBill).toHaveBeenCalled()

        const form = screen.getByTestId('form-new-bill')
        expect(form).toBeTruthy()
      })
    })

    test("Then bills should be ordered from earliest to latest", async () => {
      const emulatedBills = await new Bills({
        document, onNavigate, store: mockStore, localStorage
      }).getBills();

      //change date format
      const bills = emulatedBills.map(bill => ({ ...bill, date: bill.unformattedDate }))

      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    // test d'intégration GET
    describe("Given I am a user connected as Employee", () => {
      describe("When I navigate to Bills", () => {
        test("fetches bills from mock API GET", async () => {
          localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
          const root = document.createElement("div")
          root.setAttribute("id", "root")
          document.body.append(root)
          router()
          window.onNavigate(ROUTES_PATH.Bills)
          await waitFor(() => screen.getByText("Mes notes de frais"))
          const billName =  screen.getByText("encore")
          expect(billName).toBeTruthy()
          const billIcons =  screen.queryAllByTestId("icon-eye")
          expect(billIcons[0]).toHaveAttribute("data-bill-url", "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a")
          expect(screen.getByTestId("btn-new-bill")).toBeTruthy()
        })
        describe("When an error occurs on API", () => {
          beforeEach(() => {
            jest.spyOn(mockStore, "bills")
            Object.defineProperty(
              window,
              'localStorage',
              { value: localStorageMock }
            )
            window.localStorage.setItem('user', JSON.stringify({
              type: 'Employee',
              email: "a@a"
            }))
            const root = document.createElement("div")
            root.setAttribute("id", "root")
            document.body.appendChild(root)
            router()
          })
          test("fetches bills from an API and fails with 404 message error", async () => {

            mockStore.bills.mockImplementationOnce(() => {
              return {
                list: () => {
                  return Promise.reject(new Error("Erreur 404"))
                }
              }
            })
            window.onNavigate(ROUTES_PATH.Bills)
            await new Promise(process.nextTick);
            const message = await screen.getByText(/Erreur 404/)
            expect(message).toBeTruthy()
          })

          test("fetches bills from an API and fails with 500 message error", async () => {

            mockStore.bills.mockImplementationOnce(() => {
              return {
                list: () => {
                  return Promise.reject(new Error("Erreur 500"))
                }
              }
            })

            window.onNavigate(ROUTES_PATH.Bills)
            await new Promise(process.nextTick);
            const message = await screen.getByText(/Erreur 500/)
            expect(message).toBeTruthy()
          })
        })
      })
    })
  })
})
