export type User = { id: number; name: string; email: string };

export type LoginRes = { accessToken: string; user: User };
export type RegisterReq = {
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  birthDate: string;
  phoneNumber: string;
  email: string;
  password: string;
  termsAccepted: boolean;
};
