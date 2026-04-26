"use client";

import type { NdaFormData, NdaParty } from "@/lib/nda-types";

interface NdaFormProps {
  data: NdaFormData;
  onChange: (data: NdaFormData) => void;
}

const labelClass = "block text-sm font-medium text-zinc-700 mb-1";
const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";
const yearsInputClass =
  "w-20 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-400";
const sectionClass = "border-b border-zinc-200 pb-6 mb-6 last:border-b-0 last:mb-0";
const sectionHeadingClass = "text-base font-semibold text-zinc-900 mb-3";

export function NdaForm({ data, onChange }: NdaFormProps) {
  const update = <K extends keyof NdaFormData>(key: K, value: NdaFormData[K]) => {
    onChange({ ...data, [key]: value });
  };

  const updateParty = (
    party: "party1" | "party2",
    key: keyof NdaParty,
    value: string,
  ) => {
    onChange({ ...data, [party]: { ...data[party], [key]: value } });
  };

  return (
    <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
      <section className={sectionClass}>
        <h3 className={sectionHeadingClass}>Agreement details</h3>

        <div className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="purpose">
              Purpose
            </label>
            <textarea
              id="purpose"
              className={inputClass}
              rows={3}
              value={data.purpose}
              onChange={(e) => update("purpose", e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="effectiveDate">
              Effective Date
            </label>
            <input
              id="effectiveDate"
              type="date"
              className={inputClass}
              value={data.effectiveDate}
              onChange={(e) => update("effectiveDate", e.target.value)}
            />
          </div>

          <fieldset>
            <legend className={labelClass}>MNDA Term</legend>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="ndaTermKind"
                  checked={data.ndaTermKind === "years"}
                  onChange={() => update("ndaTermKind", "years")}
                />
                <span>Expires</span>
                <input
                  type="number"
                  min={1}
                  className={yearsInputClass}
                  value={data.ndaTermYears}
                  onChange={(e) =>
                    update("ndaTermYears", Math.max(1, Number(e.target.value) || 1))
                  }
                  disabled={data.ndaTermKind !== "years"}
                />
                <span>year(s) from Effective Date.</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="ndaTermKind"
                  checked={data.ndaTermKind === "untilTerminated"}
                  onChange={() => update("ndaTermKind", "untilTerminated")}
                />
                <span>Continues until terminated.</span>
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend className={labelClass}>Term of Confidentiality</legend>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="confidentialityKind"
                  checked={data.confidentialityKind === "years"}
                  onChange={() => update("confidentialityKind", "years")}
                />
                <input
                  type="number"
                  min={1}
                  className={yearsInputClass}
                  value={data.confidentialityYears}
                  onChange={(e) =>
                    update(
                      "confidentialityYears",
                      Math.max(1, Number(e.target.value) || 1),
                    )
                  }
                  disabled={data.confidentialityKind !== "years"}
                />
                <span>year(s) from Effective Date (trade secrets last longer).</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="confidentialityKind"
                  checked={data.confidentialityKind === "perpetuity"}
                  onChange={() => update("confidentialityKind", "perpetuity")}
                />
                <span>In perpetuity.</span>
              </label>
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="governingLawState">
                Governing Law (state)
              </label>
              <input
                id="governingLawState"
                type="text"
                placeholder="e.g. Delaware"
                className={inputClass}
                value={data.governingLawState}
                onChange={(e) => update("governingLawState", e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="jurisdiction">
                Jurisdiction
              </label>
              <input
                id="jurisdiction"
                type="text"
                placeholder="e.g. New Castle County, Delaware"
                className={inputClass}
                value={data.jurisdiction}
                onChange={(e) => update("jurisdiction", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="modifications">
              MNDA Modifications
            </label>
            <textarea
              id="modifications"
              className={inputClass}
              rows={2}
              placeholder="List any modifications to the MNDA, or leave blank."
              value={data.modifications}
              onChange={(e) => update("modifications", e.target.value)}
            />
          </div>
        </div>
      </section>

      <PartyFieldset
        title="Party 1"
        party={data.party1}
        onUpdate={(key, value) => updateParty("party1", key, value)}
      />

      <PartyFieldset
        title="Party 2"
        party={data.party2}
        onUpdate={(key, value) => updateParty("party2", key, value)}
      />
    </form>
  );
}

interface PartyFieldsetProps {
  title: string;
  party: NdaParty;
  onUpdate: (key: keyof NdaParty, value: string) => void;
}

function PartyFieldset({ title, party, onUpdate }: PartyFieldsetProps) {
  const fieldId = (k: string) => `${title.toLowerCase().replace(/\s+/g, "-")}-${k}`;
  return (
    <section className={sectionClass}>
      <h3 className={sectionHeadingClass}>{title}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor={fieldId("company")}>
            Company
          </label>
          <input
            id={fieldId("company")}
            type="text"
            className={inputClass}
            value={party.company}
            onChange={(e) => onUpdate("company", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={fieldId("printName")}>
            Print Name
          </label>
          <input
            id={fieldId("printName")}
            type="text"
            className={inputClass}
            value={party.printName}
            onChange={(e) => onUpdate("printName", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={fieldId("title")}>
            Title
          </label>
          <input
            id={fieldId("title")}
            type="text"
            className={inputClass}
            value={party.title}
            onChange={(e) => onUpdate("title", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={fieldId("noticeAddress")}>
            Notice Address (email or postal)
          </label>
          <input
            id={fieldId("noticeAddress")}
            type="text"
            className={inputClass}
            value={party.noticeAddress}
            onChange={(e) => onUpdate("noticeAddress", e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}
