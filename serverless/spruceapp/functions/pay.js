exports.handler = function(context, event, callback) {
  console.log("in Pay");
  console.log(event);
  console.log(event.Result);
  
let twiml = new Twilio.twiml.VoiceResponse();

switch (event.Result) {
  case "success":
      text = "Thank you for your payment";
      break;
  case "payment-connector-error":
      text = "The Payment Gateway is reporting an error";
      console.log(decodeURIComponent(event.PaymentError));
      break;
  
  default: 
      text = "The payment was not completed successfully";
}
twiml.say(text);
callback(null, twiml);
};