// Seeds the local Firebase emulators with a test user and 15 feed posts.
// Emulator-only: talks to 127.0.0.1 and uses the emulator's "owner" token to
// bypass security rules. Safe to re-run (fixed IDs are overwritten).
// Run with the emulators already started: npm run seed:emulator
const PROJECT = "wetravel-569a0";
const AUTH = "http://127.0.0.1:9099";
const FS = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
const EMAIL = "feedtester@wetravel.test";
const PASSWORD = "password123";

async function post(url, body, headers = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, json: await res.json() };
}

async function getOrCreateUser() {
  const signUp = await post(
    `${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-key`,
    { email: EMAIL, password: PASSWORD, displayName: "Feed Tester", returnSecureToken: true },
  );
  if (signUp.ok) return signUp.json.localId;
  if (signUp.json.error?.message !== "EMAIL_EXISTS") {
    throw new Error(`signUp failed: ${JSON.stringify(signUp.json)}`);
  }
  const signIn = await post(
    `${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-key`,
    { email: EMAIL, password: PASSWORD, returnSecureToken: true },
  );
  if (!signIn.ok) throw new Error(`signIn failed: ${JSON.stringify(signIn.json)}`);
  return signIn.json.localId;
}

const str = (v) => ({ stringValue: v });
const ts = (ms) => ({ timestampValue: new Date(ms).toISOString() });
const geo = (name, lat, lng) => ({
  mapValue: {
    fields: { name: str(name), latitude: { doubleValue: lat }, longitude: { doubleValue: lng } },
  },
});

async function putDoc(path, fields) {
  const res = await fetch(`${FS}/${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: "Bearer owner" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error(`write ${path} failed: ${res.status} ${await res.text()}`);
}

// Newest first. null location = post without one.
const POSTS = [
  ["Sunset in Kyoto", "Golden hour over the temple rooftops.", ["Kyoto, Japan", 35.0116, 135.7681]],
  ["Lisbon tram ride", "Tram 28 is worth the line.", ["Lisbon, Portugal", 38.7223, -9.1393]],
  ["Packing tips", "Roll, don't fold. Thank me later.", null],
  ["Banff lakes", "Moraine Lake at sunrise, unreal colors.", ["Banff, Canada", 51.1784, -115.5708]],
  ["Street food in Bangkok", "Mango sticky rice everywhere.", ["Bangkok, Thailand", 13.7563, 100.5018]],
  ["Jet lag hacks", "Sunlight + no naps on day one.", null],
  ["Cliffs of Moher", "Windy but absolutely worth it.", ["County Clare, Ireland", 52.9715, -9.4309]],
  ["Shibuya crossing", "Watched it from the Starbucks upstairs.", ["Tokyo, Japan", 35.6595, 139.7005]],
  ["Budget travel", "Overnight buses saved me a fortune.", null],
  ["Santorini views", "Oia is crowded at sunset — go early.", ["Santorini, Greece", 36.4618, 25.3753]],
  // ---- page 2 starts here (PAGE_SIZE = 10) ----
  ["Machu Picchu hike", "Day 3 of the Inca Trail.", ["Cusco, Peru", -13.1631, -72.545]],
  ["Hostel review", "Great vibes, terrible Wi-Fi.", null],
  ["Bad location data", "Stored location is out of range, so the card should show no 📍 line.", ["Nowhere", 123, 456]],
  ["Reykjavik northern lights", "Took three nights but we saw them.", ["Reykjavik, Iceland", 64.1466, -21.9426]],
  ["My first trip", "Oldest post: you should see \"You're all caught up\" after this.", null],
];

const uid = await getOrCreateUser();
const now = Date.now();

await putDoc(`users/${uid}`, {
  displayName: str("Feed Tester"),
  bio: str("Seeded emulator account"),
  createdAt: ts(now),
  updatedAt: ts(now),
});

for (const [i, [title, description, loc]] of POSTS.entries()) {
  const createdAt = now - i * 6 * 60 * 60 * 1000; // 6h apart, distinct
  const fields = {
    authorId: str(uid),
    title: str(title),
    description: str(description),
    // Every 4th post has no image to show the image-less card.
    imageUrl: str(i % 4 === 2 ? "" : `https://picsum.photos/seed/wetravel-${i}/800/450`),
    createdAt: ts(createdAt),
    updatedAt: ts(createdAt),
  };
  if (loc) fields.location = geo(...loc);
  await putDoc(`posts/seed-post-${String(i + 1).padStart(2, "0")}`, fields);
}

console.log(`Seeded user ${EMAIL} (uid ${uid}) and ${POSTS.length} posts.`);
