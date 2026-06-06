export const PAGE_PATHS = {
    DFA_PAGE: "/dfa",
    TM_PAGE: "/tm"
};

export const BASE_PATH = process.env.NODE_ENV === "development"
    ? ""
    : "/Automata-Playground";
