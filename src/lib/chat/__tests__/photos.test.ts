/**
 * Free-text photo label matching.
 * Run: npx tsx --test src/lib/chat/__tests__/photos.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeTags,
  parsePhotoIntent,
  rankPhotosForIntent,
} from "@/lib/chat/photos";

const gallery = [
  {
    id: "1",
    url: "https://x/face.jpg",
    kind: "face",
    tags: ["face", "selfie"],
    caption: null,
  },
  {
    id: "2",
    url: "https://x/hand.jpg",
    kind: "hand",
    tags: ["hand"],
    caption: null,
  },
  {
    id: "3",
    url: "https://x/foot.jpg",
    kind: "foot",
    tags: ["pie"],
    caption: null,
  },
  {
    id: "4",
    url: "https://x/spicy.jpg",
    kind: "nude",
    tags: ["nude", "spicy"],
    caption: null,
  },
];

describe("normalizeTags", () => {
  it("accepts free-text labels", () => {
    assert.deepEqual(normalizeTags("red car, pear"), ["red car", "pear"]);
    assert.deepEqual(normalizeTags(["Hand", "HAND"]), ["hand"]);
  });
});

describe("parsePhotoIntent", () => {
  it("extracts face / hand / car subjects", () => {
    const face = parsePhotoIntent("hey, give me a photo of your face");
    assert.equal(face.wantsPhoto, true);
    assert.ok(face.query.includes("face"));

    const hand = parsePhotoIntent("send me a pic of your hand");
    assert.equal(hand.wantsPhoto, true);
    assert.ok(hand.query.includes("hand"));

    const car = parsePhotoIntent("dame una foto de un coche");
    assert.equal(car.wantsPhoto, true);
    assert.ok(car.query.includes("coche") || car.query.includes("car"));
  });

  it("treats filler-only asks as generic (no fake subject)", () => {
    for (const msg of [
      "Really? Send me some pic",
      "ok send a pic",
      "send me a photo really",
      "yeah send me a foto babe",
    ]) {
      const intent = parsePhotoIntent(msg);
      assert.equal(intent.wantsPhoto, true, msg);
      assert.deepEqual(intent.query, [], msg);
      assert.equal(intent.requestedLabel, null, msg);
    }
  });

  it("still extracts show me your tits", () => {
    const intent = parsePhotoIntent("show me your tits");
    assert.equal(intent.wantsPhoto, true);
    assert.ok(intent.query.includes("tits"));
  });
});

describe("rankPhotosForIntent", () => {
  it("picks labeled face / hand / foot", () => {
    const face = rankPhotosForIntent(
      gallery,
      parsePhotoIntent("photo of your face"),
    );
    assert.equal(face.miss, false);
    assert.equal(face.photos[0]?.id, "1");

    const hand = rankPhotosForIntent(
      gallery,
      parsePhotoIntent("pic of your hand"),
    );
    assert.equal(hand.photos[0]?.id, "2");

    const foot = rankPhotosForIntent(
      gallery,
      parsePhotoIntent("foto de tu pie"),
    );
    assert.equal(foot.photos[0]?.id, "3");
  });

  it("misses when no label matches (car)", () => {
    const car = rankPhotosForIntent(
      gallery,
      parsePhotoIntent("send me a photo of a car"),
    );
    assert.equal(car.miss, true);
    assert.equal(car.photos.length, 0);
  });

  it("generic ask prefers soft photos over spicy", () => {
    const ranked = rankPhotosForIntent(
      gallery,
      parsePhotoIntent("Really? Send me some pic"),
    );
    assert.equal(ranked.miss, false);
    assert.ok(ranked.photos.length > 0);
    assert.ok(
      ranked.photos.every((p) => p.id !== "4"),
      "spicy must not be in generic opener pool when soft exists",
    );
    assert.ok(ranked.photos.every((p) => ["1", "2", "3"].includes(p.id)));
  });

  it("explicit spicy ask still matches nude", () => {
    const ranked = rankPhotosForIntent(
      gallery,
      parsePhotoIntent("send nudes"),
    );
    assert.equal(ranked.miss, false);
    assert.equal(ranked.photos[0]?.id, "4");
  });
});
