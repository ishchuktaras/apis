export const generateEmailHtml = (
  clientName: string, 
  salonName: string, 
  date: string, 
  time: string, 
  serviceName: string, 
  price: number, 
  cancelLink: string, 
  salonAddress: string
) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Poppins', sans-serif; background-color: #f8f9fa; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { background-color: #1A1A1A; padding: 24px; text-align: center; }
    .header h1 { color: #F4C430; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
    .content { padding: 32px 24px; color: #333333; line-height: 1.6; }
    .details { background-color: #F8F5E6; border-left: 4px solid #F4C430; padding: 16px; margin: 24px 0; border-radius: 4px; }
    .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .detail-label { color: #666; font-size: 14px; }
    .detail-value { font-weight: bold; color: #1A1A1A; }
    .btn { display: inline-block; padding: 12px 24px; background-color: #F4C430; color: #1A1A1A; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; margin-top: 16px; }
    .footer { background-color: #f1f1f1; padding: 16px; text-align: center; font-size: 12px; color: #888; }
    .cancel-link { color: #ef4444; text-decoration: underline; font-size: 12px; margin-top: 16px; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${salonName}</h1>
    </div>
    <div class="content">
      <h2 style="margin-top: 0; color: #1A1A1A;">Rezervace potvrzena ✅</h2>
      <p>Dobrý den, <strong>${clientName}</strong>,</p>
      <p>Těšíme se na vaši návštěvu! Vaše rezervace byla úspěšně uložena do našeho systému.</p>
      
      <div class="details">
        <div style="margin-bottom: 8px;"><strong>📅 Datum:</strong> ${date}</div>
        <div style="margin-bottom: 8px;"><strong>⏰ Čas:</strong> ${time}</div>
        <div style="margin-bottom: 8px;"><strong>✂️ Služba:</strong> ${serviceName}</div>
        <div><strong>💰 Cena:</strong> ${price} Kč</div>
      </div>

      <p style="font-size: 14px; color: #666;">
        📍 Adresa: <strong>${salonAddress}</strong><br>
        (Doporučujeme přijít o 5 minut dříve)
      </p>

      <div style="text-align: center; margin-top: 32px;">
        <a href="${cancelLink}" class="cancel-link">Nemůžete dorazit? Zrušit rezervaci</a>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${salonName} • Powered by APIS</p>
    </div>
  </div>
</body>
</html>
  `
}
