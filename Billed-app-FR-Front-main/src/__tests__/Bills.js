/**
 * @jest-environment jsdom
 */
import {fireEvent, screen, waitFor} from "@testing-library/dom"
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

    })

    describe("When I click on eye icon", () => {
      test("A modal should open", () => {
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
  })
})
