import { describe, expect, test } from "bun:test";
import { SA_CITIES } from "../skinWeather/cities";
import { getClimateCue } from "../skinWeather/climate";
import { FORBIDDEN_TIP_TERMS } from "../skinWeather/tips";

describe("getClimateCue", () => {
  test("names the Highveld and the coast, and says nothing for the lowveld", () => {
    expect(getClimateCue("johannesburg")?.zone).toBe("highveld");
    expect(getClimateCue("kimberley")?.zone).toBe("highveld");
    expect(getClimateCue("cape-town")?.zone).toBe("coastal");
    expect(getClimateCue("durban")?.zone).toBe("coastal");
    expect(getClimateCue("mbombela")).toBeNull();
  });
  test("every supported city resolves without throwing", () => {
    for (const c of SA_CITIES) expect(() => getClimateCue(c.key)).not.toThrow();
  });
  test("copy stays cosmetic (no claim or medical terms)", () => {
    for (const c of SA_CITIES) {
      const cue = getClimateCue(c.key);
      if (!cue) continue;
      for (const term of FORBIDDEN_TIP_TERMS) {
        expect(`${cue.text} ${cue.short}`.toLowerCase()).not.toContain(String(term).toLowerCase());
      }
    }
  });
});
