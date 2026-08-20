export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

export interface InterestCategory {
  id: string;
  label: string;
  hint: string;
}

export const INTEREST_CATEGORIES: InterestCategory[] = [
  { id: "SSC", label: "SSC", hint: "Staff Selection Commission" },
  { id: "Banking", label: "Banking", hint: "Banking exams" },
  { id: "Railway", label: "Railway", hint: "Railway recruitment" },
  { id: "State PSC", label: "State PSC", hint: "State Public Service Commission" },
  { id: "Police", label: "Police", hint: "Police recruitment" },
];
