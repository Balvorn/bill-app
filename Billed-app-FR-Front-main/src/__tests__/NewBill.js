/**
 * @jest-environment jsdom
 */

import { ROUTES } from "../constants/routes";
import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import user from '@testing-library/user-event';
import { waitFor } from "@testing-library/dom";
import mockStore from "../__mocks__/store"
import { localStorageMock } from "../__mocks__/localStorage.js"

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    describe("When I do not fill fields and I click on Send", () => {
      test("Then it should render NewBill page", () => {
        document.body.innerHTML = NewBillUI();

        const inputEmailUser = screen.getByTestId("expense-name");
        expect(inputEmailUser.value).toBe("");

        const datepicker = screen.getByTestId("datepicker");
        expect(datepicker.value).toBe("");

        const amount = screen.getByTestId("amount");
        expect(amount.value).toBe("");

        const vat = screen.getByTestId("vat");
        expect(vat.value).toBe("");

        const pct = screen.getByTestId("pct");
        expect(pct.value).toBe("");

        const file = screen.getByTestId("file");
        expect(file.value).toBe("");

        const form = screen.getByTestId("form-new-bill");
        const handleSubmit = jest.fn((e) => e.preventDefault());

        form.addEventListener("submit", handleSubmit);
        fireEvent.submit(form);
        expect(screen.getByTestId("form-new-bill")).toBeTruthy();
      });
    });
    describe("When I fill incorrect file type", () => {
      test("Then it should show an alert", async() => {
        document.body.innerHTML = NewBillUI();
        global.alert = jest.fn();

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });


        const expensename = screen.getByTestId("expense-name");
        fireEvent.change(expensename, { target: { value: "Repas" } });
        expect(expensename.value).toBe("Repas");

        const datepicker = screen.getByTestId("datepicker");
        fireEvent.change(datepicker, { target: { value: '2020-05-12' } });
        expect(datepicker.value).toBe("2020-05-12");

        const amount = screen.getByTestId("amount");
        fireEvent.change(amount, { target: { value: "205" } });
        expect(amount.value).toBe("205");

        const vat = screen.getByTestId("vat");
        expect(vat.value).toBe("");

        const pct = screen.getByTestId("pct");
        fireEvent.change(pct, { target: { value: "12" } });
        expect(pct.value).toBe("12");

        const file = new File(["(⌐□_□)"], "chucknorris.pdf", { type: "pdf" });

        const filename = screen.getByTestId("file");
        /*Listener is in NewBill constructor*/
        user.upload(filename, file)
        await waitFor(() => expect(filename.files[0].name).toBe('chucknorris.pdf'));

        expect(global.alert).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId("form-new-bill")).toBeTruthy();
      });
    });
  });

  // test d'intégration POST
  describe("When I send my newBill", () => {
    beforeEach(async () => {
      jest.spyOn(mockStore, "bills")

      document.body.innerHTML = NewBillUI();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a"
      }))

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const expensename = screen.getByTestId("expense-name");
      fireEvent.change(expensename, { target: { value: "Kebab salade tomate oignon" } });
      expect(expensename.value).toBe("Kebab salade tomate oignon");

      const datepicker = screen.getByTestId("datepicker");
      fireEvent.change(datepicker, { target: { value: '2000-01-01' } });
      expect(datepicker.value).toBe("2000-01-01");

      const amount = screen.getByTestId("amount");
      fireEvent.change(amount, { target: { value: "205" } });
      expect(amount.value).toBe("205");

      const vat = screen.getByTestId("vat");
      expect(vat.value).toBe("");

      const pct = screen.getByTestId("pct");
      fireEvent.change(pct, { target: { value: "12" } });
      expect(pct.value).toBe("12");

      const file = new File(["(⌐□_□)"], "chucknorris.jpg", { type: "image/jpeg" });

      const filename = screen.getByTestId("file");
      /*Listener is in NewBill constructor*/
      user.upload(filename, file)
      await waitFor(() => expect(filename.files[0].name).toBe('chucknorris.jpg'));

    })
    test("Then it should redirect to Bills", async () => {
      /*Listener is in NewBill constructor*/
      const form = screen.getByTestId("form-new-bill");
      fireEvent.submit(form);
      await waitFor(() => screen.getByText("Mes notes de frais"))
      await waitFor(() => expect(screen.getByTestId("btn-new-bill")).toBeTruthy());
    });

    describe("When an error occurs on API", () => {
      beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation(() => { });
      });

      afterAll(() => {
        console.error.mockRestore();
      });

      afterEach(() => {
        console.error.mockClear();
      });
      test("Posts bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            update: (bill) => {
              return Promise.reject(new Error("Erreur 404"))
            }
          }
        })
        await new Promise(process.nextTick);
        const form = screen.getByTestId("form-new-bill");
        fireEvent.submit(form);
        await waitFor(() => expect(screen.getByTestId("btn-new-bill")).toBeTruthy());
        expect(console.error).toHaveBeenCalledWith(new Error("Erreur 404"));
      })

      test("fetches bills from an API and fails with 500 message error", async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return {
            update: (bill) => {
              return Promise.reject(new Error("Erreur 500"))
            }
          }
        })
        await new Promise(process.nextTick);
        const form = screen.getByTestId("form-new-bill");
        fireEvent.submit(form);
        await waitFor(() => expect(screen.getByTestId("btn-new-bill")).toBeTruthy());
        expect(console.error).toHaveBeenCalledWith(new Error("Erreur 500"));
      })
    })
  })
})
