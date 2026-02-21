import { Empty, Table, Text } from "@cloudflare/kumo";
import { useQuery } from "convex/react";
import type { ReactNode } from "react";

import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import { useCurrentLanguage } from "../contexts/CurrentLanguageContext";

const POS_BG: Record<Doc<"words">["pos"], string> = {
  noun: "bg-green-600 text-white",
  verb: "bg-red-600 text-white",
  adjective: "bg-purple-600 text-white",
};
const GENDER_BG: Record<NonNullable<Doc<"words">["gender"]>, string> = {
  M: "bg-blue-600 text-white",
  F: "bg-fuchsia-600 text-white",
  N: "bg-teal-600 text-white",
};

const POS_LETTER: Record<Doc<"words">["pos"], string> = {
  noun: "n",
  verb: "v",
  adjective: "a",
};
const GENDER_LETTER: Record<NonNullable<Doc<"words">["gender"]>, string> = {
  M: "m",
  F: "f",
  N: "n",
};

function formatWordWithPos(word: Pick<Doc<"words">, "text" | "pos" | "gender">): ReactNode {
  const posSpan = (
    <span className={`inline-block px-1 ${POS_BG[word.pos]}`} aria-hidden>
      {POS_LETTER[word.pos]}
    </span>
  );
  const genderSpan = word.gender ? (
    <span className={`inline-block px-1 ${GENDER_BG[word.gender]}`} aria-hidden>
      {GENDER_LETTER[word.gender]}
    </span>
  ) : null;
  return (
    <>
      <span>
        {word.text}
        <span className="sr-only">
          , Part of speech: {word.pos}
          {word.gender ? `, Gender: ${word.gender}` : ""}
        </span>
      </span>
      <span>
        {posSpan}
        {genderSpan}
      </span>
    </>
  );
}

export function WordsPage() {
  const { user } = useAuth();
  const { language } = useCurrentLanguage();
  const words = useQuery(api.words.listByUserAndLanguage, { language });

  return (
    <section className="space-y-4">
      <Text variant="heading2">Words</Text>
      <p className="text-slate-600">Manage your vocabulary list here.</p>

      {words === undefined ? (
        <p className="text-slate-500" aria-busy="true">
          Loading…
        </p>
      ) : words.length === 0 ? (
        <Empty
          title={user ? "No words yet" : "Log in to manage your words"}
          description={
            user
              ? "Add words for the current language to see them here."
              : "Sign in to view and manage your vocabulary."
          }
        />
      ) : (
        <div className="min-w-0 overflow-x-auto">
          <Table className="w-full" layout="auto">
            <Table.Header>
              <Table.Row>
                <Table.Head>Text</Table.Head>
                <Table.Head>Meaning</Table.Head>
                <Table.Head>Tags</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {words.map((word) => (
                <Table.Row key={word._id}>
                  <Table.Cell>
                    <div className="flex justify-between items-baseline">
                      {formatWordWithPos(word)}
                    </div>
                  </Table.Cell>
                  <Table.Cell>{word.meaning}</Table.Cell>
                  <Table.Cell>
                    <span className="whitespace-nowrap">{word.tags ?? "—"}</span>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      )}
    </section>
  );
}
