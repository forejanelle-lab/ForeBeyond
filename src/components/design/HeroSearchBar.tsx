"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Calendar, Users, ChevronDown } from "lucide-react";
import { hostCountrySuggestions } from "@/lib/destination-suggestions";
import { TRAVELER_ACCOUNT_SEARCH_MESSAGE } from "@/lib/traveler-verification";
import { useTodayIso } from "@/hooks/use-today-iso";

const GUEST_OPTIONS = [
  { value: "1", label: "1 guest" },
  { value: "2", label: "2 guests" },
  { value: "3", label: "3 guests" },
  { value: "4", label: "4 guests" },
  { value: "5", label: "5 guests" },
  { value: "5+", label: "5+ guests" },
];

function formatDisplayDate(iso: string) {
  if (!iso) return "";
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

interface HeroSearchBarProps {
  disabled?: boolean;
  disabledMessage?: string;
  variant?: "hero" | "page";
  availableCountries?: string[];
  initialCountry?: string;
}

export function HeroSearchBar({
  disabled = false,
  disabledMessage = TRAVELER_ACCOUNT_SEARCH_MESSAGE,
  variant = "hero",
  availableCountries = [],
  initialCountry = "",
}: HeroSearchBarProps) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);

  const destinations = hostCountrySuggestions(availableCountries);
  const [country, setCountry] = useState(initialCountry);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [showDates, setShowDates] = useState(false);

  const [guests, setGuests] = useState("1");
  const [showGuests, setShowGuests] = useState(false);
  const today = useTodayIso();
  const guestLabel = GUEST_OPTIONS.find((g) => g.value === guests)?.label ?? "1 guest";

  const dateLabel =
    checkIn && checkOut
      ? `${formatDisplayDate(checkIn)} — ${formatDisplayDate(checkOut)}`
      : checkIn
        ? `${formatDisplayDate(checkIn)} — Check out`
        : "Check in — Check out";

  useEffect(() => {
    setCountry(initialCountry);
  }, [initialCountry]);

  const closeAll = useCallback(() => {
    setShowDates(false);
    setShowGuests(false);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        closeAll();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeAll]);

  function handleSearch() {
    if (disabled) return;
    const params = new URLSearchParams();

    if (country) params.set("country", country);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", guests);

    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search");
  }

  const isHero = variant === "hero";

  return (
    <div className="relative w-full max-w-4xl group">
      <div
        ref={rootRef}
        className={`relative w-full overflow-visible bg-white shadow-lg p-2 md:p-2.5 transition-opacity ${
          isHero
            ? "rounded-2xl border border-sage-dark/20 shadow-xl"
            : "rounded-2xl border border-sage-dark/25 md:rounded-full"
        } ${disabled ? "opacity-50 select-none [&_select]:pointer-events-none [&_input]:pointer-events-none [&_button]:pointer-events-none" : ""}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_0.9fr_auto] gap-2 md:gap-0 md:divide-x divide-sage-dark/30 overflow-visible">
          <div className="relative px-2 md:px-0 border-b md:border-b-0 border-sage-dark/20 pb-2 md:pb-0">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
              <MapPin className="h-5 w-5 text-forest shrink-0" />
              <div className="flex-1 min-w-0">
                <label htmlFor="hero-where" className="text-xs font-medium text-charcoal-light block">
                  Where
                </label>
                <select
                  id="hero-where"
                  value={country}
                  disabled={disabled || destinations.length === 0}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setShowDates(false);
                    setShowGuests(false);
                  }}
                  className="w-full appearance-none bg-transparent text-sm text-charcoal focus:outline-none focus:ring-0 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {destinations.length === 0 ? "No destinations yet" : "Select a destination"}
                  </option>
                  {destinations.map((destination) => (
                    <option key={destination.country} value={destination.country}>
                      {destination.label}
                    </option>
                  ))}
                </select>
              </div>
              <ChevronDown className="h-4 w-4 text-charcoal-light shrink-0 pointer-events-none" />
            </div>
          </div>

          <div
            className={`relative px-2 md:px-0 border-b md:border-b-0 border-sage-dark/20 pb-2 md:pb-0 ${
              showDates ? "z-30" : ""
            }`}
          >
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                setShowDates((v) => !v);
                setShowGuests(false);
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sage/30 transition-colors text-left w-full disabled:cursor-not-allowed"
            >
              <Calendar className="h-5 w-5 text-forest shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-charcoal-light">When</p>
                <p className={`text-sm truncate ${checkIn ? "text-charcoal" : "text-charcoal-light/70"}`}>
                  {dateLabel}
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-charcoal-light shrink-0 transition-transform ${showDates ? "rotate-180" : ""}`}
              />
            </button>
            {showDates && (
              <div className="absolute left-0 right-0 md:left-auto md:right-0 md:w-72 top-full mt-1 z-50 rounded-xl bg-white border border-sage-dark/30 shadow-lg p-4 space-y-3">
                <div>
                  <label htmlFor="hero-check-in" className="text-xs font-medium text-charcoal-light block mb-1">
                    Check in
                  </label>
                  <input
                    id="hero-check-in"
                    type="date"
                    min={today}
                    value={checkIn}
                    onChange={(e) => {
                      setCheckIn(e.target.value);
                      if (checkOut && e.target.value > checkOut) setCheckOut("");
                    }}
                    className="w-full rounded-lg border border-sage-dark/40 px-3 py-2 text-sm text-charcoal focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
                  />
                </div>
                <div>
                  <label htmlFor="hero-check-out" className="text-xs font-medium text-charcoal-light block mb-1">
                    Check out
                  </label>
                  <input
                    id="hero-check-out"
                    type="date"
                    min={checkIn || today}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    disabled={!checkIn}
                    className="w-full rounded-lg border border-sage-dark/40 px-3 py-2 text-sm text-charcoal focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20 disabled:opacity-50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowDates(false)}
                  className="w-full rounded-lg bg-forest text-white text-sm font-medium py-2 hover:bg-forest-light transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>

          <div
            className={`relative px-2 md:px-0 border-b md:border-b-0 border-sage-dark/20 pb-2 md:pb-0 ${
              showGuests ? "z-30" : ""
            }`}
          >
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                setShowGuests((v) => !v);
                setShowDates(false);
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sage/30 transition-colors text-left w-full disabled:cursor-not-allowed"
            >
              <Users className="h-5 w-5 text-forest shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-charcoal-light">Guests</p>
                <p className="text-sm text-charcoal">{guestLabel}</p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-charcoal-light shrink-0 transition-transform ${showGuests ? "rotate-180" : ""}`}
              />
            </button>
            {showGuests && (
              <ul className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl bg-white border border-sage-dark/30 shadow-lg py-1">
                {GUEST_OPTIONS.map((opt) => (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => {
                        setGuests(opt.value);
                        setShowGuests(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        guests === opt.value
                          ? "bg-sage/60 text-forest font-medium"
                          : "text-charcoal hover:bg-sage/40"
                      }`}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-center p-1 md:pl-2">
            <button
              type="button"
              onClick={handleSearch}
              disabled={disabled}
              aria-label="Search families"
              className={`flex items-center justify-center gap-2 bg-forest text-white hover:bg-forest-light transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed ${
                isHero
                  ? "h-12 w-12 rounded-full"
                  : "h-11 md:h-12 rounded-full md:rounded-full px-5 md:px-6 w-full md:w-auto text-sm font-medium"
              }`}
            >
              <Search className="h-5 w-5" />
              {!isHero && <span>Search</span>}
            </button>
          </div>
        </div>
      </div>

      {disabled && (
        <>
          <div
            className="absolute inset-0 z-10 cursor-not-allowed rounded-2xl"
            aria-label={disabledMessage}
            title={disabledMessage}
          />
          <div
            role="tooltip"
            className="pointer-events-none absolute left-1/2 top-full z-30 mt-3 w-[min(100%,20rem)] -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <div className="rounded-xl bg-charcoal text-white text-sm px-4 py-3 text-center shadow-lg">
              {disabledMessage}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
