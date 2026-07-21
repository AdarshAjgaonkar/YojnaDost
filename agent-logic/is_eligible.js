const profile = $json; // current user profile from Loop Over Items
const scheme = $('Google Sheets Trigger').first().json; // the newly added scheme

function isEligible(profile, scheme) {
  const incomeCap = Number(scheme.income_cap_annual);
  if (profile.age < scheme.min_age || profile.age > scheme.max_age) return false;
  if (!isNaN(incomeCap) && profile.income > incomeCap) return false;
  if (scheme.occupation_eligible !== "Any" &&
      !scheme.occupation_eligible.includes(profile.occupation)) return false;
  if (scheme.state_eligible !== "All States" &&
      scheme.state_eligible !== profile.state) return false;
  if (scheme.caste_category !== "Any" &&
      !scheme.caste_category.includes(profile.caste_category)) return false;
  if (scheme.gender_eligible !== "Any" &&
      scheme.gender_eligible !== profile.gender) return false;
  if (scheme.disability_required === true && !profile.disability) return false;
  return true;
}

const eligible = isEligible(profile, scheme);

return [{ json: { ...profile, eligible, scheme_id: scheme.scheme_id, scheme_name: scheme.scheme_name, scheme_data: scheme } }];
