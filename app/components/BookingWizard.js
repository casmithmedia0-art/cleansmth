"use client";

import { useMemo, useRef, useState } from "react";
import vehicleModelCatalog from "../lib/vehicle-models";

const serviceOrigin = "2 Bank Road, Johannesburg, Gauteng, South Africa";
let routesLibraryPromise;

const vehicleTypes = [
  ["hatch", "Hatchback / small car"],
  ["sedan", "Sedan"],
  ["suv", "SUV / bakkie"],
  ["luxury", "Luxury / sports"],
  ["minibus", "Minibus / van"],
];
function money(value) {
  return Number(value || 0).toLocaleString("en-ZA");
}

function formatDistance(distanceKm) {
  return `${distanceKm.toFixed(3)} km`;
}

function loadRoutesLibrary() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error("Distance calculation requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY."));
  }

  if (window.google?.maps?.importLibrary) {
    return window.google.maps.importLibrary("routes");
  }

  if (!routesLibraryPromise) {
    routesLibraryPromise = new Promise((resolve, reject) => {
      const callbackName = "__cleansmithGoogleMapsReady";
      const script = document.createElement("script");
      window[callbackName] = () => {
        delete window[callbackName];
        resolve();
      };
      script.async = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&callback=${callbackName}`;
      script.onerror = () => {
        delete window[callbackName];
        reject(new Error("Google Maps could not be loaded."));
      };
      document.head.appendChild(script);
    }).then(() => {
      if (!window.google?.maps?.importLibrary) {
        throw new Error("Google Maps loaded without the Routes library.");
      }
      return window.google.maps.importLibrary("routes");
    }).catch((error) => {
      routesLibraryPromise = undefined;
      throw error;
    });
  }

  return routesLibraryPromise;
}

export default function BookingWizard({ packages, bookingAddons, selectedPackage, onPackageChange }) {
  const [step, setStep] = useState(1);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [year, setYear] = useState("");
  const [vehicleSize, setVehicleSize] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [address, setAddress] = useState("");
  const [travelEstimate, setTravelEstimate] = useState(null);
  const [distanceStatus, setDistanceStatus] = useState("idle");
  const [distanceError, setDistanceError] = useState("");
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const distanceRequestId = useRef(0);
  const [color, setColor] = useState("");
  const [registration, setRegistration] = useState("");
  const [vehicleNotes, setVehicleNotes] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [addons, setAddons] = useState([]);
  const packageRecord = packages.find((item) => item.slug === selectedPackage);
  const modelOptions = vehicleModelCatalog[make] || [];
  const modelName = model === "__other__" ? customModel.trim() : model;
  const vehicleName = [year, make, modelName].filter(Boolean).join(" ");
  const basePrice = Number(packageRecord?.vehicle_prices?.[vehicleSize] || 0);
  const addonTotal = addons.reduce((total, slug) => {
    const addon = bookingAddons.find((item) => item.slug === slug);
    return total + (addon ? Number(addon.price) : 0);
  }, 0);
  const total = basePrice + addonTotal + (travelEstimate?.fee || 0);
  const priceLabel = useMemo(() => total > 0 ? `R ${money(total)}` : "R —", [total]);
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 1989 }, (_, index) => String(currentYear - index));
  }, []);

  function chooseMake(value) {
    setMake(value);
    setModel("");
    setCustomModel("");
    setVehicleSize("");
  }

  function chooseModel(value) {
    setModel(value);
    setCustomModel("");
    const selected = modelOptions.find(([name]) => name === value);
    if (selected) setVehicleSize(selected[1]);
  }

  function changeAddress(value) {
    distanceRequestId.current += 1;
    setAddress(value);
    setTravelEstimate(null);
    setDistanceStatus("idle");
    setDistanceError("");
    setIsCalculatingDistance(false);
  }

  async function calculateTravelDistance() {
    const destination = address.trim();
    if (!destination) {
      setDistanceError("Enter the full service address, including suburb and city.");
      setDistanceStatus("error");
      return;
    }

    const requestId = distanceRequestId.current + 1;
    distanceRequestId.current = requestId;
    setIsCalculatingDistance(true);
    setDistanceStatus("loading");
    setDistanceError("");

    try {
      const { Route } = await loadRoutesLibrary();
      const { routes } = await Route.computeRoutes({
        origin: serviceOrigin,
        destination,
        travelMode: "DRIVING",
        fields: ["distanceMeters"],
      });
      if (requestId !== distanceRequestId.current) return;

      const distanceMeters = routes?.[0]?.distanceMeters;
      if (!Number.isFinite(distanceMeters) || distanceMeters < 0) {
        throw new Error("Google Maps did not return a drivable route for this address.");
      }

      const chargeableKilometres = Math.max(0, Math.ceil((distanceMeters - 5000) / 1000));
      setTravelEstimate({
        distanceKm: distanceMeters / 1000,
        chargeableKilometres,
        fee: chargeableKilometres * 15,
      });
      setDistanceStatus("success");
    } catch (error) {
      if (requestId !== distanceRequestId.current) return;
      console.error("Unable to calculate the CLEANSMITH driving distance:", error);
      setTravelEstimate(null);
      setDistanceStatus("error");
      const errorMessage = error instanceof Error ? error.message : String(error);
      setDistanceError(errorMessage.includes("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY")
        ? "Distance calculation is not configured yet. Please contact CLEANSMITH to confirm your travel fee."
        : "Unable to calculate a driving route. Check the full address and try again.");
    } finally {
      if (requestId === distanceRequestId.current) setIsCalculatingDistance(false);
    }
  }

  function continueWizard() {
    if (step === 1) {
      if (!make || !model || (model === "__other__" && !customModel.trim()) || !year || !vehicleSize || !selectedPackage) {
        window.alert("Please select your vehicle make, model, year, size, and package to continue.");
        return;
      }
    }
    if (step === 2 && (!date || !time || !address.trim())) {
      window.alert("Please choose a date, time, and address to continue.");
      return;
    }
    if (step === 2 && !travelEstimate) {
      window.alert("Calculate the driving distance before continuing.");
      return;
    }
    setStep((current) => Math.min(3, current + 1));
  }

  function bookingMessage() {
    const parts = [
      "Hello CLEANSMITH team,",
      "I would like to request a booking. Please confirm availability.",
      "---",
      `Name: ${name}`,
      `Contact: ${phone}${email ? ` | ${email}` : ""}`,
      `Vehicle: ${vehicleName} (${vehicleTypes.find(([value]) => value === vehicleSize)?.[1] || vehicleSize})`,
    ];
    if (color.trim()) parts.push(`Vehicle colour: ${color.trim()}`);
    if (registration.trim()) parts.push(`Vehicle registration: ${registration.trim()}`);
    if (vehicleNotes.trim()) parts.push(`Vehicle notes: ${vehicleNotes.trim()}`);
    parts.push(`Package: ${packageRecord?.name || selectedPackage}`);
    if (addons.length) {
      parts.push(`Add-ons: ${addons.map((slug) => bookingAddons.find((item) => item.slug === slug)?.name || slug).join(", ")}`);
    }
    parts.push(`Preferred date & time: ${date} ${time}`, `Address: ${address}`);
    if (travelEstimate) {
      parts.push(
        `Driving distance from CLEANSMITH: ${formatDistance(travelEstimate.distanceKm)}`,
        travelEstimate.chargeableKilometres
          ? `Travel charge: ${travelEstimate.chargeableKilometres} km × R15 = R ${money(travelEstimate.fee)}`
          : "Travel charge: R 0 (within the first 5 km)",
      );
    }
    if (notes.trim()) parts.push(`Notes: ${notes.trim()}`);
    parts.push(`Estimated total: R ${money(total)}`);
    parts.push("---", "Thanks,", name);
    return parts.join("\n");
  }

  function sendWhatsApp() {
    if (!name.trim() || !phone.trim()) {
      window.alert("Please enter your name and contact number.");
      return;
    }
    window.open(`https://wa.me/27717856901?text=${encodeURIComponent(bookingMessage())}`, "_blank", "noopener,noreferrer");
  }

  function sendEmail() {
    if (!name.trim() || !phone.trim()) {
      window.alert("Please enter your name and contact number.");
      return;
    }
    const subject = encodeURIComponent(`CLEANSMITH Booking Request - ${name}`);
    window.location.href = `mailto:info@cleansmith.co.za?subject=${subject}&body=${encodeURIComponent(bookingMessage())}`;
  }

  return (
    <div className="booking-wrapper fade-up">
      <div className="wizard">
        <div className="wizard-steps">
          <div className="step-pill"><div className="fill" style={{ width: `${((step - 1) / 2) * 100}%` }} /></div>
          <div className="step-label">Step {step} of 3</div>
        </div>
        {step === 1 ? (
          <div className="wizard-step">
            <div className="vehicle-fields">
              <label className="form-label">Vehicle make *
                <select className="form-control" value={make} onChange={(event) => chooseMake(event.target.value)} required>
                  <option value="">Select make</option>
                  {["BMW", "Mercedes-Benz", "Audi", "Toyota", "Volkswagen", "Ford", "Nissan", "Honda", "Hyundai", "Kia", "Mazda", "Lexus", "Land Rover", "Porsche", "Volvo", "Suzuki", "Isuzu", "Renault", "Subaru", "Other"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="form-label">Model *
                <select className="form-control" value={model} disabled={!make} onChange={(event) => chooseModel(event.target.value)} required>
                  <option value="">{make ? "Select model" : "Choose a make first"}</option>
                  {modelOptions.map(([modelOption]) => <option key={modelOption}>{modelOption}</option>)}
                  {make ? <option value="__other__">Other / not listed</option> : null}
                </select>
              </label>
              {model === "__other__" ? (
                <label className="form-label">Enter model *
                  <input className="form-control" value={customModel} onChange={(event) => setCustomModel(event.target.value)} required />
                </label>
              ) : null}
              <label className="form-label">Year *
                <select className="form-control" value={year} onChange={(event) => setYear(event.target.value)} required>
                  <option value="">Select year</option>
                  {years.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="form-label">Vehicle size *
                <select className="form-control" value={vehicleSize} onChange={(event) => setVehicleSize(event.target.value)} required>
                  <option value="">Select vehicle size</option>
                  {vehicleTypes.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
              </label>
            </div>
            <div className="wizard-packages">
              {packages.map((item) => (
                <button
                  type="button"
                  key={item.slug}
                  className={`pkg-select-card${item.style === "featured" ? " featured" : ""}${item.style === "executive" ? " executive" : ""}${selectedPackage === item.slug ? " active" : ""}`}
                  onClick={() => onPackageChange(item.slug)}
                >
                  {item.name}<br /><strong>R{money(item.starting_price)}</strong>
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {step === 2 ? (
          <div className="wizard-step">
            <div className="wizard-preview">
              <strong>Selected:</strong>
              <span>{vehicleName || "—"}{vehicleSize ? ` · ${vehicleTypes.find(([value]) => value === vehicleSize)?.[1]}` : ""}</span>
              <span>{packageRecord?.name || "—"}</span>
              <strong className="cyan">{priceLabel}</strong>
              <span>
                {travelEstimate
                  ? `Travel: ${formatDistance(travelEstimate.distanceKm)} · ${travelEstimate.fee ? `R ${money(travelEstimate.fee)}` : "No travel charge"}`
                  : "Travel fee: calculate from your address"}
              </span>
            </div>
            <div className="vehicle-fields">
              <label className="form-label">Preferred date *
                <input className="form-control" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
              </label>
              <label className="form-label">Preferred time *
                <select className="form-control" value={time} onChange={(event) => setTime(event.target.value)} required>
                  <option value="">Select time</option>
                  {["07:00 – 09:00", "09:00 – 11:00", "11:00 – 13:00", "13:00 – 15:00", "15:00 – 17:00"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="form-label">Vehicle colour
                <input className="form-control" value={color} onChange={(event) => setColor(event.target.value)} />
              </label>
              <label className="form-label">Registration (optional)
                <input className="form-control" value={registration} onChange={(event) => setRegistration(event.target.value)} />
              </label>
              <label className="form-label field-wide">Vehicle condition or special instructions
                <input className="form-control" value={vehicleNotes} onChange={(event) => setVehicleNotes(event.target.value)} placeholder="For example, pet hair, stains, or a specific area to focus on" />
              </label>
              <label className="form-label field-wide">Full service address (street, suburb, city) *
                <input className="form-control" value={address} onChange={(event) => changeAddress(event.target.value)} placeholder="Street address, suburb, city" required />
              </label>
            </div>
            <div className="distance-calculation">
              <button
                type="button"
                className="btn-secondary"
                onClick={calculateTravelDistance}
                disabled={!address.trim() || isCalculatingDistance}
              >
                {isCalculatingDistance ? "Calculating route…" : travelEstimate ? "Recalculate distance" : "Calculate travel fee"}
              </button>
              <div role="status" aria-live="polite">
                {distanceStatus === "success" ? (
                  <p>
                    Driving distance: {formatDistance(travelEstimate.distanceKm)}. First 5 km included; each started kilometre after that is R15.
                    {" "}Travel fee: <strong>R {money(travelEstimate.fee)}</strong>
                  </p>
                ) : distanceStatus === "error" ? (
                  <p className="distance-error">{distanceError}</p>
                ) : distanceStatus === "loading" ? (
                  <p>Finding the driving distance from CLEANSMITH…</p>
                ) : (
                  <p>Calculate the driving route to include any travel fee in your estimate.</p>
                )}
              </div>
            </div>
            <div className="addon-options">
              <p className="form-label">Add-on services</p>
              {bookingAddons.map(({ slug, name: label, price }) => (
                <label className="addon-pill" key={slug}>
                  <input
                    type="checkbox"
                    checked={addons.includes(slug)}
                    onChange={(event) => setAddons((current) => event.target.checked ? [...current, slug] : current.filter((item) => item !== slug))}
                  />
                  {label} (+R{price})
                </label>
              ))}
            </div>
          </div>
        ) : null}
        {step === 3 ? (
          <div className="wizard-step">
            <div className="wizard-summary">
              <div><strong>Vehicle:</strong> {vehicleName} · {vehicleTypes.find(([value]) => value === vehicleSize)?.[1]}</div>
              <div><strong>Package:</strong> {packageRecord?.name}</div>
              <div><strong>Driving distance:</strong> {travelEstimate ? formatDistance(travelEstimate.distanceKm) : "—"}</div>
              <div><strong>Travel fee:</strong> R {money(travelEstimate?.fee)}</div>
              <strong className="cyan">{priceLabel}</strong>
            </div>
            <div className="contact-fields">
              <label className="form-label">Full name *
                <input className="form-control" value={name} onChange={(event) => setName(event.target.value)} required />
              </label>
              <label className="form-label">Contact number *
                <input className="form-control" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required />
              </label>
              <label className="form-label">Email
                <input className="form-control" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
              <label className="form-label">Notes
                <textarea className="form-control" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
              </label>
            </div>
            <div className="price-est">
              <div className="price-est-label">Estimated total</div>
              <div className="price-est-value">{priceLabel}</div>
            </div>
            <div className="final-actions">
              <button type="button" className="btn-primary" onClick={sendWhatsApp}>Send via WhatsApp</button>
              <button type="button" className="btn-secondary" onClick={sendEmail}>Send via Email</button>
            </div>
          </div>
        ) : null}
        <div className="booking-actions">
          {step > 1 ? <button type="button" className="btn-secondary" onClick={() => setStep((current) => current - 1)}>Back</button> : null}
          {step < 3 ? <button type="button" className="btn-primary" onClick={continueWizard}>Next</button> : null}
        </div>
      </div>
    </div>
  );
}
