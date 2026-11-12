import { describe, expect, it } from "vitest";

import { SURPRISE_TEMPLATES, canSendSurprise, greetingFromTemplate, type SurpriseForm } from "@/lib/send-surprise";

const hug = SURPRISE_TEMPLATES.find((t) => t.id === "knus")!;
const complete: SurpriseForm = {
  senderName: "Bedstemor",
  templateId: hug.id,
  greeting: greetingFromTemplate(hug),
  recipientName: "Barnebarn",
  recipientPhone: "12 34 56 78",
};

describe("Send surprise", () => {
  it("offers the five requested surprise cards in order", () => {
    expect(SURPRISE_TEMPLATES.map((t) => t.title)).toEqual([
      "Morfar til barnebarn",
      "Moster til nevø",
      "Bedstemor til barnebarn",
      "Ven til ven",
      "Giv jeres barnebarn et uventet knus",
    ]);
  });

  it("the button is active when all three parts are filled", () => {
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
