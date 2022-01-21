import logo from "./spruceApp-logo.png";
import { useState, useEffect } from "react";
import "./App.css";
import { baseUrl } from "./config";

var {SyncClient} = require("twilio-sync");


function CurrentDonation(props){
  if (!props.data.amount) {
    return (
      <div className="currentDetails">
      </div>
    );
  } 
  return (
    <div className="currentDetails">
      <p>{props.data.amount}</p>
      <p>Donated by:{props.data.from}</p>
    </div>
  )
}

function CurrentExpense(props){
  if (!props.data.amount) {
    return (
      <div className="currentDetails">
      </div>
  )
  } 
  return (
    <div className="currentDetails">
      <p>{props.data.amount}</p>
      <p>Description:{props.data.description}</p>
    </div>
  )
}

function App() {
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [syncClient, setSyncClient] = useState(null);
  const [inT, setIncomingList] = useState([]);
  const [outT, setOutgoingList] = useState([]);
  const [currentDonation, setCurrentDonation] = useState({});
  const [currentExpense, setCurrentExpense] = useState({});

  useEffect(async ()=>{
    let token = await getAccessToken();
    var syncClient = new SyncClient(token);
    setSyncClient(syncClient);
    const incomingList = await syncClient.list('incoming');
    const outgoingList = await syncClient.list('outgoing');

    let inList = await incomingList.getItems();
    let outList = await outgoingList.getItems();

    setIncomingList(inList.items);
    setOutgoingList(outList.items);

    incomingList.on('itemAdded', event => {
      if (!event.isLocal) {
        console.log("item added", event);
        setIncomingList((inT)=> [...inT, event.item]);
      }
    });
    outgoingList.on('itemAdded', event => {
      if (!event.isLocal) {
        console.log("item added", event);
        setOutgoingList((outT)=> [...outT, event.item]);
      }
    });

    incomingList.on('itemRemoved', event =>{
      if (!event.isLocal) {
        console.log("item removed", event);
      }
    });

  },[]);


  async function getAccessToken() {
    const res = await fetch(`${baseUrl}/token`);
    const data = await res.json();
    setToken(data.token);
    return data.token; 
  }

  async function createExpense(sc){
    
    let expense = { 
        amount: parseFloat(document.getElementById('amount').value),
        description: document.getElementById('description').value 
      };

    console.log('sending this', expense);
    const res = await fetch(
      `${baseUrl}/handleOutgoing`,
      {
        method: "POST",
        body: JSON.stringify(expense),
        headers: {
          'Content-Type': 'application/json'
          // 'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    const data = await res.json();
    console.log(data);
    setMessage(`${ data.response} - Total of ${data.entries.length} notified`);
    if (data.response && data.response == 'updated'){
      console.log('success');
      document.getElementById('amount').value = '';
      document.getElementById('description').value = '';
    }
    return data

  }

  function showDonation(i){
    console.log(i);
    setCurrentDonation(i.data);
  }

  function showExpense(i){
    console.log(i);
    setCurrentExpense(i.data);
  }


  return (
    <div className="App">
      <div  className="topnav">
        <img className="logo" src={logo}/>
        <p>SpruceApp</p>
      </div>
      <header className="App-header">
        <h1>Bucket #1: donation counter</h1>
        <div className="instructions" >
        1. To make a donation call <b>+32 460 253 236</b> <br/>
        2. Enter text Credit card number: <b>4242 4242 4242 4242</b><br/> 
        3. Expiry date (MM/YY): <b>12 25</b> (pick a date in the future)<br/>
        4. CVC security code: <b>333</b> <br/> 
        </div>
        
          <h4>Donations so far: {inT.length} </h4>

        <div className="bucketContainer">
        <CurrentDonation data={currentDonation}/>
        
        <div className="bucket">
          <div className="bucket-inT">
            {inT.map(i => (
              <div 
                className="inT" 
                style={{height:`${i.data.amount*3}px`}} 
                key={i.uri} 
                onClick={()=>showDonation(i)}>
                {i.data.amount}
                </div>
            ))}
          </div>

          <div className="bucket-outT">
            {outT.map(i => (
              <div 
                className="outT" 
                style={{height:`${i.data.amount*3}px`}} 
                key={i.uri}
                onClick={()=>showExpense(i)}>
                {i.data.amount}
              </div>
            ))}
          </div>
        </div>
        <CurrentExpense data={currentExpense}/>
       </div>
        <div className="expense-form">
        <h1>Create expense</h1>
          <input id='amount' className="expense-field" min="10" type="number" placeholder="Amount"></input>
          <textarea id='description' className="expense-field"  type="text" placeholder="Description"></textarea>
          <button onClick={(syncClient)=>{createExpense(syncClient)}}>Submit</button>
          <h2>{message}</h2>
        </div>
        

      </header>
    </div>
  );
}

export default App;
