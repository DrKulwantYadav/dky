"use client";
import { FormEvent, useState } from "react";

const reasons=["Diabetes","Blood pressure","Fatty liver","Weight management","Fever or infection","Respiratory problem","Digestive problem","Headache","Seizure follow-up","Kidney-related concern","Report review","Other medical concern"];

export default function AppointmentForm(){
  const [submitted,setSubmitted]=useState(false);
  function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setSubmitted(true);event.currentTarget.reset();window.scrollTo({top:0,behavior:"smooth"});}
  if(submitted)return <div className="appointment-success" role="status" aria-live="polite"><span>Request received</span><h2>Your appointment request has been received.</h2><p>The clinic will contact you to confirm the date and time. This request is not a confirmed appointment until you receive confirmation.</p><button type="button" onClick={()=>setSubmitted(false)}>Submit another request</button><small>Preview note: secure clinic delivery must be connected before this form is used publicly.</small></div>;
  return <form className="appointment-form" onSubmit={submit}>
    <div className="form-intro"><span>Book an appointment</span><p>Choose a preferred date and time. The clinic will contact you to confirm availability.</p></div>
    <div className="field-grid">
      <label><span>Patient name *</span><input name="patientName" autoComplete="name" required placeholder="Full name"/></label>
      <label><span>Mobile number *</span><input name="mobile" type="tel" inputMode="tel" autoComplete="tel" required placeholder="Mobile number"/></label>
      <label><span>Email <small>Optional</small></span><input name="email" type="email" autoComplete="email" placeholder="name@example.com"/></label>
      <label><span>Age group *</span><select name="ageGroup" required defaultValue=""><option value="" disabled>Select age group</option><option>18–29 years</option><option>30–44 years</option><option>45–59 years</option><option>60–74 years</option><option>75 years or above</option></select></label>
      <label><span>Patient type *</span><select name="patientType" required defaultValue=""><option value="" disabled>Select patient type</option><option>New patient</option><option>Follow-up patient</option></select></label>
      <label><span>Consultation mode *</span><select name="mode" required defaultValue=""><option value="" disabled>Select consultation mode</option><option>In-person consultation</option><option>Ask about teleconsultation availability</option></select></label>
      <label><span>Preferred date *</span><input name="preferredDate" type="date" required/></label>
      <label><span>Preferred time *</span><select name="preferredTime" required defaultValue=""><option value="" disabled>Select preferred time</option><option>Morning</option><option>Afternoon</option><option>Evening</option><option>Any available time</option></select></label>
      <label className="field-wide"><span>Broad reason for consultation *</span><select name="reason" required defaultValue=""><option value="" disabled>Select a broad reason</option>{reasons.map(reason=><option key={reason}>{reason}</option>)}</select><small>Do not enter medical history here. The clinician will take an appropriate history during consultation.</small></label>
    </div>
    <label className="consent-field"><input name="consent" type="checkbox" required/><span>I consent to the clinic using these contact and appointment details to respond to this request. I understand this is not a confirmed appointment and is not an emergency service. *</span></label>
    <button className="submit-appointment" type="submit">Request appointment <span>→</span></button>
    <p className="form-security-note">Preview status: this interface does not currently transmit or store submitted information. Connect it to an approved secure clinic workflow before public launch.</p>
  </form>;
}
