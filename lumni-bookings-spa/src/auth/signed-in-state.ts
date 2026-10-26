// Set in the history entry the sign-in navigates to, so that page can greet the user once.
declare module '@tanstack/react-router' {
  interface HistoryState {
    signedIn?: boolean
  }
}

export {}
