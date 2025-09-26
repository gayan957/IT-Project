// src/components/UserDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import api from "../lib/api";
import ImprovedMapPicker from "./ImprovedMapPicker";
import { 
    validateName, 
    validatePhone, 
    validateBirthday, 
    validateIdCard,
    getMaxBirthdayDate,
    handleNameInput,
    handlePhoneInput,
    handleIdCardInput
} from '../lib/validation';

export default function UserDetails() {
  const { user, setUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    birthday: "",
    idCardNumber: "",
  });
  const [mapPos, setMapPos] = useState(null);

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.firstName || "",
      middleName: user.middleName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      birthday: user.birthday ? new Date(user.birthday).toISOString().slice(0, 10) : "",
      idCardNumber: user.idCardNumber || "",
    });
    if (user.location?.coordinates?.length === 2) {
      const [lng, lat] = user.location.coordinates;
      setMapPos({ lat, lng });
    }
  }, [user]);

  const onChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    // Apply real-time formatting based on field type
    if (name === 'firstName' || name === 'middleName' || name === 'lastName') {
      formattedValue = handleNameInput(e);
    } else if (name === 'phone') {
      formattedValue = handlePhoneInput(e);
    } else if (name === 'idCardNumber') {
      formattedValue = handleIdCardInput(e);
    }
    
    // Update form state
    setForm((f) => ({ ...f, [name]: formattedValue }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const payload = useMemo(() => {
    const p = {
      firstName: form.firstName,
      middleName: form.middleName || undefined,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      address: form.address,
      birthday: form.birthday,
      idCardNumber: form.idCardNumber,
    };
    if (mapPos) p.location = { type: "Point", coordinates: [mapPos.lng, mapPos.lat] };
    return p;
  }, [form, mapPos]);

  const submit = async (e) => {
    e.preventDefault();
    
    // Validate form before submitting
    const errors = {};
    
    // Validate names
    const firstNameError = validateName(form.firstName);
    if (firstNameError) {
      errors.firstName = firstNameError;
    }
    const middleNameError = form.middleName ? validateName(form.middleName) : '';
    if (middleNameError) {
      errors.middleName = middleNameError;
    }
    const lastNameError = validateName(form.lastName);
    if (lastNameError) {
      errors.lastName = lastNameError;
    }
    
    // Validate phone
    const phoneError = validatePhone(form.phone);
    if (phoneError) {
      errors.phone = phoneError;
    }
    
    // Validate birthday
    const birthdayError = validateBirthday(form.birthday);
    if (birthdayError) {
      errors.birthday = birthdayError;
    }
    
    // Validate ID card
    const idCardError = validateIdCard(form.idCardNumber);
    if (idCardError) {
      errors.idCardNumber = idCardError;
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please correct the highlighted errors');
      return;
    }
    
    setValidationErrors({});
    setSaving(true);
    setError("");
    setOk("");
    try {
      const { data } = await api.put("/api/users/me", payload);
      setUser?.(data);
      setOk("Profile updated successfully.");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Update failed";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <section className="rounded-2xl border bg-white/90 backdrop-blur shadow-xl overflow-hidden p-6">
      {/* Alerts */}
      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          {error}
        </div>
      )}
      {ok && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
          {ok}
        </div>
      )}

      {/* Form */}
      <form onSubmit={submit} className="space-y-6">
        {/* Name row */}
        <div className="space-y-3">
          <SectionTitle text="Name" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="First name" name="firstName" value={form.firstName} onChange={onChange} required validationError={validationErrors.firstName} />
            <Field label="Middle name" name="middleName" value={form.middleName} onChange={onChange} validationError={validationErrors.middleName} />
            <Field label="Last name" name="lastName" value={form.lastName} onChange={onChange} required validationError={validationErrors.lastName} />
          </div>
        </div>

        <Divider />

        {/* Contact row */}
        <div className="space-y-3">
          <SectionTitle text="Contact" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Email" name="email" type="email" value={form.email} onChange={onChange} required />
            <Field label="Phone" name="phone" value={form.phone} onChange={onChange} required validationError={validationErrors.phone} />
          </div>
        </div>

        <Divider />

        {/* Address + Birthday + ID Card */}
        <div className="space-y-3">
          <SectionTitle text="Additional Info" />
          <Field label="Address" name="address" value={form.address} onChange={onChange} required />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label text="Birthday" />
              <input
                className={`mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 ${
                  validationErrors.birthday ? 'border-red-500' : ''
                }`}
                name="birthday"
                type="date"
                value={form.birthday}
                onChange={onChange}
                max={getMaxBirthdayDate()}
                required
              />
              {validationErrors.birthday && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.birthday}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Must be 18 years or older</p>
            </div>
            <div>
              <Label text="ID Card Number" />
              <input
                className={`mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 ${
                  validationErrors.idCardNumber ? 'border-red-500' : ''
                }`}
                name="idCardNumber"
                type="text"
                value={form.idCardNumber}
                onChange={onChange}
                placeholder="123456789V or 199812345678"
                maxLength="12"
                required
              />
              {validationErrors.idCardNumber && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.idCardNumber}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Sri Lankan ID card number (9 digits + V or 12 digits)
              </p>
            </div>
          </div>
        </div>

        <Divider />

        {/* Map */}
        <div className="space-y-3">
          <SectionTitle text="Location" />
          <div className="border overflow-hidden">
            <ImprovedMapPicker 
              value={mapPos} 
              onChange={setMapPos} 
              height="400px"
              markerTitle="Your Location"
              className="rounded-lg border border-gray-300"
            />
          </div>
          <p className="text-xs text-gray-500">
            Pick a point within Sri Lanka (ocean is not allowed). This will be your default bin location.
          </p>
        </div>

        {/* Actions */}
        <div className="pt-4">
          <button
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-white shadow-md transition
                       hover:bg-emerald-500 hover:shadow-lg disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            {saving ? (
              <>
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="9" strokeWidth="2" className="opacity-30" />
                  <path d="M21 12a9 9 0 0 1-9 9" strokeWidth="2" className="opacity-80" />
                </svg>
                Saving…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M5 20h14v-2H5v2zm7-18L5.33 9h3.84v4h4.66V9h3.84L12 2z" />
                </svg>
                Save changes
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

/* ---------- helpers ---------- */
function SectionTitle({ text }) {
  return <h4 className="text-sm font-semibold text-gray-600">{text}</h4>;
}

function Divider() {
  return <hr className="border-t border-gray-200" />;
}

function Label({ text }) {
  return <label className="block text-sm font-medium text-gray-700">{text}</label>;
}

function Field({ label, name, value, onChange, type = "text", required, validationError }) {
  return (
    <div>
      <Label text={label} />
      <input
        className={`mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 ${
          validationError ? 'border-red-500' : ''
        }`}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
      />
      {validationError && (
        <p className="text-red-500 text-sm mt-1">{validationError}</p>
      )}
    </div>
  );
}
