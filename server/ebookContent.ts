type ReaderChapter = {
  kicker: string;
  title: string;
  body: string[];
};

export type ReaderEdition = {
  intro: string;
  chapters: ReaderChapter[];
};

/**
 * Server-only sample edition content. Replace individual chapter arrays when
 * publishing the creator's final manuscript; never import this module client-side.
 */
export const readerEditions: Record<string, ReaderEdition> = {
  "atlas-of-attention": {
    intro: "Attention is not the absence of distraction. It is the decision to return—again and again—to what is worth your care.",
    chapters: [
      { kicker: "CHAPTER 01", title: "Choose a horizon", body: ["A useful day begins before the first notification. Name the single horizon that would make the day feel honestly moved forward.", "The horizon does not need to be grand. It needs to be visible enough that your attention can recognize its way home."] },
      { kicker: "CHAPTER 02", title: "Make room for return", body: ["Every interruption leaves a small residue. Rather than demanding perfect focus, create a gentle ritual that makes returning inexpensive.", "Close the loop in writing: leave a sentence for your future self describing the next smallest move. The page will hold the thread while you are away."] },
      { kicker: "CHAPTER 03", title: "Protect the useful edge", body: ["Not every task deserves a whole day. Protect the edge where your particular judgment changes the outcome, then let the rest become simpler.", "The goal is not to do less as a performance. It is to make space for the kind of work only you can notice."] },
    ],
  },
  "interface-intelligence": {
    intro: "An interface is a promise about what will happen next. The best ones make that promise legible before the user has to ask.",
    chapters: [
      { kicker: "CHAPTER 01", title: "Start with the next question", body: ["Interfaces often begin with a list of available actions. Begin instead with the next question the person needs answered.", "A good screen reduces uncertainty. A good system makes the reduction feel inevitable."] },
      { kicker: "CHAPTER 02", title: "Give choices a shape", body: ["Hierarchy is not decoration. It is the quiet architecture that tells people which choice has consequence, which is reversible, and which can wait.", "Let the primary path feel calm. Reserve visual urgency for the moment it is truly earned."] },
      { kicker: "CHAPTER 03", title: "Design the after", body: ["The action is rarely the end of the experience. The confirmation, recovery path, and next invitation tell the user whether the system has kept its word.", "Design the after with as much attention as the click itself."] },
    ],
  },
  "creative-compass": {
    intro: "Direction does not arrive as certainty. It arrives as a small pattern you can recognize, name, and follow for one more step.",
    chapters: [
      { kicker: "CHAPTER 01", title: "Find the live question", body: ["When a project feels vague, it is usually carrying too many questions at once. Find the one that still has energy in it.", "A live question does not demand an immediate answer. It asks for a better next experiment."] },
      { kicker: "CHAPTER 02", title: "Use constraints as a compass", body: ["A constraint is not only a limitation. It can be a way of deciding what the work refuses to become.", "Write down what must remain true. That sentence can guide a dozen small choices without making them all at once."] },
      { kicker: "CHAPTER 03", title: "Leave evidence", body: ["Creative momentum is easier to recover when the work leaves evidence: a sketch, an annotated reference, an unfinished sentence.", "Make the next return generous. Your future self is the first reader you are designing for."] },
    ],
  },
};
