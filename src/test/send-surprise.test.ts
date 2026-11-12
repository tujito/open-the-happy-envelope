import { describe, expect, it } from "vitest";

import { SURPRISE_TEMPLATES, canSendSurprise, greetingFromTemplate, type SurpriseForm } from "@/lib/send-surprise";

const hug = SURPRISE_TEMPLATES[0]!;
const complete: SurpriseForm = {
  senderName: "Morfar",
  templateId: hug.id,
  greeting: greetingFromTemplate(hug),
  recipientName: "Barnebarn",
  recipientPhone: "12 34 56 78",
};

describe("Send surprise", () => {
  it("offers the four requested surprise cards in order", () => {
    expect(SURPRISE_TEMPLATES.map((t) => t.title)).toEqual([
      "Giv jeres barnebarn et uventet knus",
      "Send en varm hilsen",
      "Send en sang",
      "Send et minde",
    ]);
  });

  it("the button is active when all three columns are filled", () => {
    expect(canSendSurprise(complete)).toBe(true);
  });

  it("stays inactive without your own name", () => {
    expect(canSendSurprise({ ...complete, senderName: " " })).toBe(false);
  });

  it("stays inactive until a surprise card is chosen", () => {
    expect(canSendSurprise({ ...complete, templateId: null })).toBe(false);
  });

  it("stays inactive without the recipient's phone number", () => {
    expect(canSendSurprise({ ...complete, recipientPhone: "1234" })).toBe(false);
  });
});
