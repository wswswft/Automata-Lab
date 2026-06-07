export const PAGE_PATHS = {
    DFA_PAGE: "/dfa",
    NFA_PAGE: "/nfa",
    TM_PAGE: "/tm"
};

export const BASE_PATH = process.env.NODE_ENV === "development"
    ? ""
    : "/Automata-Lab";
