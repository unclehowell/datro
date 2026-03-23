  title,
  first_name,
  last_name,
  date_of_birth,
  phone,
  email,
  addresses: addressForPayload, // must match payload EXACTLY
};

const signaturePayload = JSON.stringify(signatureObject);

// ✅ Proper base64 (critical fix)
const signature = Buffer.from(signaturePayload, "utf-8").toString("base64");

    const signaturePayload = JSON.stringify(signatureObject);

    const signature = btoa(
      new TextEncoder()
        .encode(signaturePayload)
        .reduce((acc, byte) => acc + String.fromCharCode(byte), "")
    );
