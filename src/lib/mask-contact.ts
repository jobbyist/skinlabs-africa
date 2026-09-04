/** Masks an email as `abc*****@*****.tld` for directory-card display, unmasked on request. */
export const maskEmail = (email: string): string => {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(3, local.length));
  const dotIndex = domain.lastIndexOf(".");
  const tld = dotIndex >= 0 ? domain.slice(dotIndex) : "";
  return `${visible}*****@*****${tld}`;
};

/** Masks a phone as `012 *** ****` for directory-card display, unmasked on request. */
export const maskPhone = (phone: string): string => {
  const digits = phone.replace(/[^\d]/g, "").replace(/^27/, "0");
  const prefix = digits.slice(0, 3);
  return `${prefix} *** ****`;
};
