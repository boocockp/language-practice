import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
        setupFiles: ["src/test/setup.ts"],
        server: { deps: { inline: ["convex-test"] } },
        fileParallelism: true,
        projects: [
            {
                extends: true,
                test: {
                    name: "default",
                    include: configDefaults.include,
                    exclude: [
                        ...configDefaults.exclude,
                        "src/routes/WordsPage.test.tsx",
                        "src/routes/QuestionTypesPage.test.tsx",
                    ],
                    sequence: { groupOrder: 0 },
                },
            },
            {
                extends: true,
                test: {
                    name: "route-pages",
                    include: [
                        "src/routes/WordsPage.test.tsx",
                        "src/routes/QuestionTypesPage.test.tsx",
                    ],
                    fileParallelism: false,
                    sequence: { groupOrder: 1 },
                },
            },
        ],
    },
});
