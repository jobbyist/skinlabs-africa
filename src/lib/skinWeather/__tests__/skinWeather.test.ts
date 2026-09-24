import { describe, expect, test } from "bun:test";
import {
  DRY_AIR_BELOW,
  FORBIDDEN_TIP_TERMS,
  HUMID_ABOVE,
  getSkinWeatherTip,
  uvBand,
  type SkinWeatherData,
  type SkinWeatherProfile,
} from "../tips";
import { SA_CITIES, cityFromProfile, nearestCity } from "../cities";
import { SA_CITY_COORDS } from "../../../../supabase/functions/_shared/weather/provider";
import {
  OpenWeatherV4Provider,
  normaliseOneCallV3,
  normaliseOneCallV4,
  type OneCallV3Response,
  type OneCallV4Current,
  type OneCallV4Daily,
  type OneCallV4Hourly,
} from "../../../../supabase/functions/_shared/weather/openWeather";

const base: SkinWeatherData = {
  uvNow: 4,
  uvMax: 9,
  uvPeakAt: "2026-09-24T11:00:00Z", // 13:00 SAST
  humidity: 50,
  tempMax: 24,
};
const tip = (over: Partial<SkinWeatherData> = {}, profile?: SkinWeatherProfile) =>
  getSkinWeatherTip({ ...base, ...over }, profile);

describe("uvBand — WHO scale edges", () => {
  test.each([
    [0, "low"], [2, "low"], [2.4, "low"],
    [2.5, "moderate"], [3, "moderate"], [5, "moderate"],
    [6, "high"], [7, "high"],
    [8, "very_high"], [10, "very_high"],
    [11, "extreme"], [14, "extreme"],
  ] as const)("UV %p → %s", (uv, band) => {
    expect(uvBand(uv)).toBe(band);
  });

  test("negative/garbage readings clamp to low", () => {
    expect(uvBand(-1)).toBe("low");
  });
});

describe("UV advice", () => {
  test("low UV: habit reminder, no reapply instruction", () => {
    const t = tip({ uvMax: 2 });
    expect(t.band).toBe("low");
    expect(t.tip).toContain("UV is low");
    expect(t.tip).not.toContain("reapply");
  });

  test("UV 3 and above says to reapply around the peak time (SAST)", () => {
    const t = tip({ uvMax: 3 });
    expect(t.band).toBe("moderate");
    expect(t.peakTime).toBe("13:00");
    expect(t.tip).toContain("reapply around 13:00");
  });

  test("once the peak has passed, falls back to a general reapply cadence", () => {
    const t = tip({ uvMax: 9, uvPeakAt: null });
    expect(t.peakTime).toBeNull();
    expect(t.tip).toContain("reapply every two hours");
  });

  test("uses today's max, not the current reading", () => {
    expect(tip({ uvNow: 0, uvMax: 11 }).bandLabel).toBe("Extreme");
  });
});

describe("humidity advice", () => {
  test(`below ${DRY_AIR_BELOW}%: layer hydration and seal`, () => {
    expect(tip({ humidity: DRY_AIR_BELOW - 1 }).tip).toMatch(/layer hydration and seal/i);
  });

  test(`${DRY_AIR_BELOW}% exactly is not "dry air"`, () => {
    expect(tip({ humidity: DRY_AIR_BELOW }).tip).not.toMatch(/dry/i);
  });

  test(`above ${HUMID_ABOVE}%: lighter textures`, () => {
    expect(tip({ humidity: HUMID_ABOVE + 1 }).tip).toMatch(/lighter/i);
  });

  test(`${HUMID_ABOVE}% exactly is not "humid"`, () => {
    expect(tip({ humidity: HUMID_ABOVE }).tip).not.toMatch(/humid/i);
  });
});

describe("profile-aware wording", () => {
  test("dehydrated skin + dry air gets specific layering advice", () => {
    const generic = tip({ humidity: 20 }).tip;
    const personal = tip({ humidity: 20 }, { skinType: "normal", concerns: ["dehydration"] }).tip;
    expect(personal).not.toBe(generic);
    expect(personal).toMatch(/dehydration-prone/i);
  });

  test("dry skin type also counts as dehydration-prone", () => {
    expect(tip({ humidity: 20 }, { skinType: "dry" }).tip).toMatch(/richer moisturiser/i);
  });

  test("oily skin + humidity suggests gel textures and blotting", () => {
    expect(tip({ humidity: 85 }, { skinType: "oily" }).tip).toMatch(/gel moisturiser.*blot/i);
  });

  test("sensitive skin + dry air suggests fragrance-free", () => {
    expect(tip({ humidity: 20 }, { concerns: ["Sensitivity"] }).tip).toMatch(/fragrance-free/i);
  });

  test("no profile still produces a tip", () => {
    expect(tip().tip.length).toBeGreaterThan(10);
  });
});

describe("compliance: cosmetic guidance only", () => {
  const profiles: (SkinWeatherProfile | undefined)[] = [
    undefined,
    { skinType: "dry", concerns: ["dehydration"] },
    { skinType: "oily", concerns: ["breakouts"] },
    { skinType: "combination", concerns: ["sensitivity", "barrier_support"] },
  ];
  const uvs = [0, 3, 6, 8, 11];
  const humidities = [10, 29, 50, 71, 95];
  test("no output across the whole grid contains a medical/claim term", () => {
    for (const profile of profiles)
      for (const uvMax of uvs)
        for (const humidity of humidities)
          for (const uvPeakAt of [base.uvPeakAt, null]) {
            const text = tip({ uvMax, humidity, uvPeakAt, tempMax: 32 }, profile).tip.toLowerCase();
            for (const term of FORBIDDEN_TIP_TERMS) expect(text.includes(term)).toBe(false);
          }
  });
});

describe("cities", () => {
  test("client list mirrors the edge function allow-list exactly", () => {
    const server = Object.entries(SA_CITY_COORDS)
      .map(([key, c]) => ({ key, label: c.label, lat: c.lat, lon: c.lon }))
      .sort((a, b) => a.key.localeCompare(b.key));
    const client = [...SA_CITIES].sort((a, b) => a.key.localeCompare(b.key));
    expect(client).toEqual(server);
  });

  test("the cache table's CHECK constraint lists the same keys", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const sql = readFileSync(resolve(import.meta.dir, "../../../../supabase/migrations/20260924110000_skin_weather_cache.sql"), "utf8");
    for (const c of SA_CITIES) expect(sql).toContain(`'${c.key}'`);
  });

  test("nearestCity snaps a precise position to the city (e.g. Sandton → Johannesburg, Stellenbosch → Cape Town)", () => {
    expect(nearestCity(-26.107, 28.056).key).toBe("johannesburg");
    expect(nearestCity(-33.932, 18.861).key).toBe("cape-town");
    expect(nearestCity(-29.6, 30.38).key).toBe("durban"); // Pietermaritzburg
    expect(nearestCity(-25.87, 28.19).key).toBe("pretoria"); // Centurion
  });

  test("cityFromProfile understands labels, keys and common old/short names", () => {
    expect(cityFromProfile("Cape Town")?.key).toBe("cape-town");
    expect(cityFromProfile("  joburg ")?.key).toBe("johannesburg");
    expect(cityFromProfile("Port Elizabeth")?.key).toBe("gqeberha");
    expect(cityFromProfile("Nelspruit")?.key).toBe("mbombela");
    expect(cityFromProfile("Stellenbosch")).toBeUndefined();
    expect(cityFromProfile(null)).toBeUndefined();
  });
});

describe("OpenWeather One Call 3.0 normaliser", () => {
  // 2026-09-24, SAST (UTC+2). current = 09:00 SAST (07:00Z).
  const at = (isoZ: string) => Math.floor(new Date(isoZ).getTime() / 1000);
  const response = (currentZ: string, hours: [string, number][], dailyUvi = 9): OneCallV3Response => ({
    timezone_offset: 7200,
    current: { dt: at(currentZ), uvi: 2.26, humidity: 27.4 },
    hourly: hours.map(([z, uvi]) => ({ dt: at(z), uvi })),
    daily: [{ dt: at("2026-09-24T10:00:00Z"), uvi: dailyUvi, temp: { max: 26.6 } }],
  });

  test("morning: peak is the highest UV hour still ahead today", () => {
    const r = normaliseOneCallV3(
      response("2026-09-24T07:00:00Z", [
        ["2026-09-24T07:00:00Z", 2.2],
        ["2026-09-24T10:00:00Z", 8.7],
        ["2026-09-24T11:00:00Z", 9.1],
        ["2026-09-24T12:00:00Z", 8.0],
        ["2026-09-25T11:00:00Z", 11], // tomorrow — must be ignored
      ]),
    );
    expect(r.uvPeakAt).toBe("2026-09-24T11:00:00.000Z");
    expect(r.uvMax).toBe(9.1);
    expect(r.uvNow).toBe(2.3);
    expect(r.humidity).toBe(27);
    expect(r.tempMax).toBe(27);
  });

  test("late afternoon: peak already passed → uvPeakAt null, uvMax keeps today's max", () => {
    const r = normaliseOneCallV3(
      response("2026-09-24T14:00:00Z", [
        ["2026-09-24T14:00:00Z", 2.0],
        ["2026-09-24T15:00:00Z", 0.8],
      ]),
    );
    expect(r.uvPeakAt).toBeNull();
    expect(r.uvMax).toBe(9);
  });

  test("malformed payloads throw instead of producing a bogus reading", () => {
    expect(() => normaliseOneCallV3({} as OneCallV3Response)).toThrow();
    expect(() =>
      normaliseOneCallV3({ timezone_offset: 0, current: { dt: 0, uvi: 1, humidity: 40 }, daily: [] }),
    ).toThrow();
  });
});

describe("OpenWeather One Call 4.0 (documented response shape)", () => {
  const at = (isoZ: string) => Math.floor(new Date(isoZ).getTime() / 1000);
  // 09:00 SAST; envelope shape mirrors openweathermap.org/api/one-call-4 examples.
  const current: OneCallV4Current = {
    timezone_offset: 7200,
    data: [{ dt: at("2026-09-24T07:03:11Z"), uvi: 2.26, humidity: 27.4 }],
  };
  const hourly: OneCallV4Hourly = {
    timezone_offset: 7200,
    data: [
      { dt: at("2026-09-24T08:00:00Z"), uvi: 4.1 },
      { dt: at("2026-09-24T11:00:00Z"), uvi: 9.1 },
      { dt: at("2026-09-24T13:00:00Z"), uvi: 6.0 },
      { dt: at("2026-09-25T11:00:00Z"), uvi: 11 }, // tomorrow — ignored
    ],
  };
  const daily: OneCallV4Daily = {
    timezone_offset: 7200,
    data: [
      { dt: at("2026-09-24T10:00:00Z"), uvi: 9, temp: { max: 26.6 } },
      { dt: at("2026-09-25T10:00:00Z"), uvi: 11, temp: { max: 30 } },
    ],
  };

  test("the three 4.0 responses normalise to the same reading shape as 3.0", () => {
    const r = normaliseOneCallV4(current, hourly, daily);
    expect(r).toEqual({
      uvNow: 2.3,
      uvMax: 9.1,
      uvPeakAt: "2026-09-24T11:00:00.000Z",
      humidity: 27,
      tempMax: 27,
      observedAt: new Date(current.data[0].dt * 1000).toISOString(),
    });
  });

  test("an empty current envelope throws rather than inventing a reading", () => {
    expect(() => normaliseOneCallV4({ timezone_offset: 7200, data: [] }, hourly, daily)).toThrow();
  });

  test("provider makes the 3 documented calls (metric units) and never leaks the key in errors", async () => {
    const calls: string[] = [];
    const body: Record<string, unknown> = { current, "timeline/1h": hourly, "timeline/1day": daily };
    const okFetch = (async (input: string) => {
      calls.push(input);
      const path = new URL(input).pathname.replace("/data/4.0/onecall/", "");
      return new Response(JSON.stringify(body[path]), { status: 200 });
    }) as unknown as typeof fetch;
    const reading = await new OpenWeatherV4Provider("SECRET-KEY", okFetch).getSkinWeather(-26.2, 28.05);
    expect(reading.uvMax).toBe(9.1);
    expect(calls.map((u) => new URL(u).pathname).sort()).toEqual([
      "/data/4.0/onecall/current",
      "/data/4.0/onecall/timeline/1day",
      "/data/4.0/onecall/timeline/1h",
    ]);
    for (const u of calls) {
      const q = new URL(u).searchParams;
      expect(q.get("units")).toBe("metric");
      expect(q.get("lat")).toBe("-26.20");
      expect(q.get("lon")).toBe("28.05");
    }

    const failFetch = (async () => new Response("nope", { status: 401 })) as unknown as typeof fetch;
    const err = await new OpenWeatherV4Provider("SECRET-KEY", failFetch).getSkinWeather(-26.2, 28.05).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toContain("401");
    expect((err as Error).message).not.toContain("SECRET-KEY");
  });
});
