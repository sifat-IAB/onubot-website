export function getDemoReply(input) {
  const question = String(input ?? '').trim();
  if (!question) return null;
  const bangla = /[\u0980-\u09ff]/.test(question);
  if (bangla) {
    if (/ডোজ|সিরাপ|বাচ্চা|জ্বর|ওষুধ|খাবার/.test(question)) {
      return 'ওষুধের ডোজের জন্য চিকিৎসক বা ফার্মাসিস্টের সঙ্গে কথা বলুন। অনূবট অ্যাপটি দেখতে নিচের কার্ডে চাপুন।';
    }
    return 'হ্যালো! অনূবটের সঙ্গে আপনার স্বাস্থ্যযাত্রা একটু সহজ হোক। অ্যাপটি দেখতে নিচের কার্ডে চাপুন।';
  }
  if (/prescription|scan|handwrit/i.test(question)) {
    return 'Onubot helps you scan and review prescriptions. You can explore it with the app card below.';
  }
  if (/doctor|book|consult|appointment/i.test(question)) {
    return 'You can explore doctors and appointment options in Onubot. Tap the app card below to get started.';
  }
  if (/dose|dosage|medicine|fever|child|antibiotic|napa|azithromycin/i.test(question)) {
    return 'Please confirm medicine doses with your doctor or pharmacist. You can explore Onubot with the app card below.';
  }
  return 'Hi! Thanks for stopping by. Take a look at Onubot using the app card below.';
}
