const AUTH_KEY = "pm-authenticated";
const DEMO_USERNAME = "user";
const DEMO_PASSWORD = "password";

const listeners = new Set<() => void>();

const notify = () => {
  listeners.forEach((listener) => listener());
};

export const subscribeToAuth = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getAuthSnapshot = () =>
  sessionStorage.getItem(AUTH_KEY) === "true";

export const getServerAuthSnapshot = () => false;

export const signIn = (username: string, password: string) => {
  if (username !== DEMO_USERNAME || password !== DEMO_PASSWORD) {
    return false;
  }

  sessionStorage.setItem(AUTH_KEY, "true");
  notify();
  return true;
};

export const signOut = () => {
  sessionStorage.removeItem(AUTH_KEY);
  notify();
};

export { DEMO_USERNAME };
