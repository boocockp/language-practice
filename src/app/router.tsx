import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "./AppLayout";
import { HomePage } from "../routes/HomePage";
import { PracticePage } from "../routes/PracticePage";
import { WordsPage } from "../routes/WordsPage";
import { QuestionTypesPage } from "../routes/QuestionTypesPage";
import { StatsPage } from "../routes/StatsPage";
import { SettingsPage } from "../routes/SettingsPage";
import { RootErrorPage } from "../routes/RootErrorPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <RootErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "practice", element: <PracticePage /> },
      { path: "words/:wordId?", element: <WordsPage /> },
      { path: "question-types", element: <QuestionTypesPage /> },
      { path: "stats", element: <StatsPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);

