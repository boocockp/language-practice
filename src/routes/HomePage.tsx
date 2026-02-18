import { Button, Surface, Text } from "@cloudflare/kumo";
import { useNavigate } from "react-router-dom";

import { useCurrentLanguage } from "../contexts/CurrentLanguageContext";
import { getLanguageName } from "../lib/languages";

export function HomePage() {
  const navigate = useNavigate();
  const { language } = useCurrentLanguage();

  return (
    <section className="space-y-4">
      <Surface className="rounded-lg border border-slate-200 p-6">
        <Text variant="heading2">Language Practice</Text>
        <p className="mt-2">You are studying {getLanguageName(language)}</p>
        <div className="mt-2">
          <Text variant="secondary">Choose an area to begin practicing.</Text>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => navigate("/practice")}>
            Start practice
          </Button>
          <Button variant="secondary" onClick={() => navigate("/words")}>
            Manage words
          </Button>
        </div>
      </Surface>
    </section>
  );
}

