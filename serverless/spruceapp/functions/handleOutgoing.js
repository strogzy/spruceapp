exports.handler = async (context, event, callback) => {
  const response = new Twilio.Response();
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };
  response.setHeaders(headers);

  let client = context.getTwilioClient();

  const syncServiceSid = context.TWILIO_SYNC_SERVICE_SID;
  const syncListName = "outgoing";
  const syncClient = Runtime.getSync({ serviceName: syncServiceSid });
  const SEND_SMS = true;

  let updateError = "";

  let t = {
    amount: parseFloat(event.amount),
    description: event.description || "blank",
    contact: event.from,
  };

  try {
    // Ensure that the Sync List exists before we try to add a new message to it
    //await getOrCreateResource(syncClient.lists, syncListName);
    let incomingList = await syncClient.lists("incoming").syncListItems.list();
    let outgoingList = await syncClient.lists("outgoing").syncListItems.list();

    let balance = 0;
    let balanceIn = 0;
    let balanceOut = 0;
    let points = {};

    outgoingList.forEach((item, key) => {
      balanceOut += parseFloat(item.data.amount);
      points.outIndex = key;
    });
    incomingList.forEach((item, key) => {
      balanceIn += parseFloat(item.data.amount);
      points.inIndex = key;
    });
    balance = balanceIn - balanceOut;
    // console.log(
    //   "balance",
    //   balance,
    //   "In",
    //   balanceIn,
    //   "Out",
    //   balanceOut,
    //   points,
    //   t
    // );
    if (balance >= t.amount) {
      let notifees = [];
      let usedDonations = [];
      let currentInBalanceStart = 0; // balance at which the current donation starts, eg. 5
      let currentInBalanceEnd = 0; // balance at which the current donation finishes
      let currentOutBalanceStart = balanceOut; // balance at which the current expense starts
      let currentOutBalanceEnd = currentOutBalanceStart + t.amount; // balance at which the current expense finishes

      //find who to notify
      incomingList.forEach((item, key) => {
        currentInBalanceStart = currentInBalanceEnd;
        currentInBalanceEnd += parseFloat(item.data.amount);

        let notify = false;
        // console.log("checking ", item.index, key,
        //   "\ncurrent exp end=",currentInBalanceEnd, 
        //   "\ncurrent exp start=",currentOutBalanceStart,
        //   "\ncurrent donation end=",currentInBalanceEnd,
        //   "\ncurrent donation start=",currentInBalanceStart
        //   );
        if (
          (currentOutBalanceEnd <= currentInBalanceEnd &&
            currentOutBalanceEnd > currentInBalanceStart) || // expense ends inside our donation
          (currentOutBalanceStart < currentInBalanceEnd &&
            currentOutBalanceStart >= currentInBalanceStart) || // expense starts inside our donation
          (currentOutBalanceStart <= currentInBalanceStart &&
            currentOutBalanceEnd >= currentInBalanceEnd) // expense starts before our donation and ends after
        ) {
          notify = true;
        }

        if (notify) {
          //console.log("adding ", t);
          notifees.push({
            contact: item.data.contact,
            description: t.description,
            ref: item.index,
          });
          usedDonations.push(item.index);
          console.log("used this", item.data, item.index);
        }
      });
      // console.log("notifees", notifees);
      // allow transaction
      //add expense to the board
      await syncClient.lists(syncListName).syncListItems.create({
        data: t,
      });
      response.setBody({
        response: "updated",
        entries: usedDonations,
      });

      //notify donors
      if (SEND_SMS) {
        // console.log("going to send");

        let res = await notifyDonors(notifees, client);
        // console.log(res);
      }
    } else {
      response.setBody({
        response: "declined, insufficient funds",
      });
    }
  } catch (error) {
    // console.error(error);
  }
  // console.log(updateError, response);

  return callback(updateError || null, response);
};

async function notifyDonors(notifees, twilioClient) {
  const messages = [];
  const response = [];
  notifees.forEach((person) => {
    let body = person.description;
    let to = person.contact;
    let from = "+32460253236";
    messages.push({ body, to, from });
  });

  console.log("running send");
  const results = await Promise.all(
    messages.map((message) => twilioClient.messages.create(message))
  );
  results.forEach((result) => {
    console.log(`Success: ${result.sid}`);
    response.push(result.sid);
  });
  return response;
}

// Helper method to simplify getting a Sync resource (Document, List, or Map)
// that handles the case where it may not exist yet.
const getOrCreateResource = async (resource, name, options = {}) => {
  try {
    // Does this resource (Sync Document, List, or Map) exist already? Return it
    return await resource(name).fetch();
  } catch (err) {
    // It doesn't exist, create a new one with the given name and return it
    options.uniqueName = name;
    return resource.create(options);
  }
};
