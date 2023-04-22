import axios from "axios";
import { showAlert } from "./alerts";
const stripe = Stripe("pk_test_z7s513Ti9TMUeZx8LlXoM7DM");

export const bookTour = async (tourId) => {
  try {
    //1. Get checkout session from API

    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

  await stripe.redirectToCheckout({
    sessionId: session.data.session.id
  })

    //2. Create checkout form + charge credit card
  } catch (err) {
    showAlert('error', err)
  }
};
