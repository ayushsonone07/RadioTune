import { configureStore } from '@reduxjs/toolkit'
import searchReducer from "@/app/lib/features/searchSlice"
import suggestionReducer from './features/suggestionSlice'
import playerReducer from "./features/playerSlice"


export const makeStore = () => {
  return configureStore({
      reducer: {
        search: searchReducer,
        suggestion: suggestionReducer,
        player: playerReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
      serializableCheck: {
        warnAfter: 128,
      },
    }),
  })
}