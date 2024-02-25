export interface User {
  index: string;
  name: string;
  hash: string;
  isLoggedIn: boolean;
  isBot?: boolean;
}
