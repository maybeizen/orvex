import { createContext, useContext, type ReactNode } from "react";

const InsideMainContext = createContext(false);

export function InsideMain({ children }: { children: ReactNode }) {
  return (
    <InsideMainContext.Provider value={true}>
      {children}
    </InsideMainContext.Provider>
  );
}

export function useInsideMain(): boolean {
  return useContext(InsideMainContext);
}
