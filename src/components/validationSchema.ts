import * as Yup from "yup";

export const chatValidationSchema = Yup.object({
  username: Yup.string()
    .matches(/^[a-zA-Z\s]{3,}$/, "Only letters & spaces (min 3 characters)")
    .required("Name is required"),

  phone: Yup.string()
    .matches(/^[0-9]{10,15}$/, "Enter a valid phone number (10 digits)")
    .required("Phone number is required"),
});
