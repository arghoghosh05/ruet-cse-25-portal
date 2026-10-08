"use client";

import { useState } from "react";

export default function ContactNumberFields({
  phoneNumber = "",
  whatsappNumber = "",
}: {
  phoneNumber?: string;
  whatsappNumber?: string;
}) {
  const [sameNumber, setSameNumber] = useState(
    Boolean(phoneNumber && whatsappNumber && phoneNumber === whatsappNumber),
  );

  return (
    <>
      <div>
        <label className="portal-label" htmlFor="phone-number">
          Phone Number <span className="text-[#B9DBC8]">*</span>
        </label>
        <input
          id="phone-number"
          name="phone_number"
          type="tel"
          defaultValue={phoneNumber}
          maxLength={32}
          required
          placeholder="Enter phone number"
          className="portal-field"
        />
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-5 text-[#DDFBEF]/75">
        <input
          type="checkbox"
          name="whatsapp_same_as_phone"
          checked={sameNumber}
          onChange={(event) => setSameNumber(event.target.checked)}
          className="whatsapp-same-checkbox mt-0.5 shrink-0"
        />
        <span>WhatsApp number is the same as phone</span>
      </label>

      <div
        aria-hidden={sameNumber}
        className={`grid transition-[grid-template-rows,opacity,transform] duration-150 ease-out ${
          sameNumber ? "grid-rows-[0fr] -translate-y-2 opacity-0" : "grid-rows-[1fr] opacity-100"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <label className="portal-label" htmlFor="whatsapp-number">
            WhatsApp Number <span className="text-[#B9DBC8]">*</span>
          </label>
          <input
            id="whatsapp-number"
            name="whatsapp_number"
            type="tel"
            defaultValue={whatsappNumber === phoneNumber ? "" : whatsappNumber}
            maxLength={32}
            required={!sameNumber}
            disabled={sameNumber}
            placeholder="Enter WhatsApp number"
            className="portal-field"
          />
        </div>
      </div>
    </>
  );
}
