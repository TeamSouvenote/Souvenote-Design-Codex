"use client";

import * as React from "react";

// A labelled form field for the Cart/Delivery screens. The label is tied to the
// control, and an error message is linked with aria-describedby and marks the
// control aria-invalid, so screen readers read it with the field.

type FlowFieldProps = {
  label: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  error?: string;
  className?: string;
  /** Renders the control, given the ids/aria props it must spread. */
  children: (control: {
    id: string;
    "aria-invalid"?: true;
    "aria-describedby"?: string;
    "aria-required"?: true;
  }) => React.ReactNode;
};

export function FlowField({ label, required, optional, error, className = "", children }: FlowFieldProps) {
  const id = React.useId();
  const errorId = `${id}-error`;

  return (
    <div className={`cf-field ${className}`.trim()}>
      <label className="cf-label" htmlFor={id}>
        {label}
        {required && <span className="cf-req" aria-hidden="true">*</span>}
        {optional && <> <span className="cf-opt">(optional)</span></>}
      </label>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? errorId : undefined,
        "aria-required": required ? true : undefined,
      })}
      {error && <span id={errorId} className="cf-err">{error}</span>}
    </div>
  );
}
