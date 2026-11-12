import { describe, expect, it } from "vitest";

import {
  FROM_PEOPLE,
  SURPRISE_TEMPLATES,
  TO_PEOPLE,
  canSendSurprise,
  coSenderChoices,
  greetingFromTemplate,
  type SurpriseForm,
} from "@/lib/send-surprise";

const hug = SURPRISE_TEMPLATES.find((t) => t.id === "knus")!;
const complete: SurpriseForm = {
  senderName: "Bedstemor",
  templateId: hug.id,
  greeting: greetingFromTemplate(hug),
  recipientName: "Barnebarn",
  recipientPhone: "12 34 56 78",
};

describe("Send surprise", () => {
  it("offers the five round surprise icons in order", () => {
    expect(SURPRISE_TEMPLATES.map((t) => t.title)).toEqual(["Knus", "Sang", "Hilsen", "Minde", "Kaffe"]);
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

  it("the left list shows who the gift is from, in this order", () => {
    expect(FROM_PEOPLE.map((p) => p.name)).toEqual([
      "Morfar",
      "Mormor",
      "Bedstemor",
      "Bedstefar",
      "Moster",
      "Onkel",
      "Ven",
      "Mor",
      "Far",
    ]);
  });

  it("the right list shows who the gift is to, in this order", () => {
    expect(TO_PEOPLE.map((p) => p.name)).toEqual([
      "Barnebarn",
      "Nevø",
      "Niece",
      "Ven",
      "Mor",
      "Far",
      "Bedstemor",
      "Morfar",
      "Moster",
      "Onkel",
    ]);
  });

  it("every person in both lists has a picture or emoji", () => {
    for (const p of [...FROM_PEOPLE, ...TO_PEOPLE]) {
      expect(p.art.trim().length).toBeGreaterThan(0);
    }
  });

  it("Tilføj medsender never offers the sender or someone already added", () => {
    const bedstemor = FROM_PEOPLE.find((p) => p.name === "Bedstemor")!;
    const bedstefar = FROM_PEOPLE.find((p) => p.name === "Bedstefar")!;
    const names = coSenderChoices(bedstemor, [bedstefar]).map((p) => p.name);
    expect(names).not.toContain("Bedstemor");
    expect(names).not.toContain("Bedstefar");
    expect(names).toContain("Morfar");
  });
});
