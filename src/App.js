import logo from "./logo.svg";
import { useState, useEffect } from "react";
import "./App.css";

var {SyncClient} = require("twilio-sync");

function App() {
  useEffect(async ()=>{
    getAccessToken()
    // .then(()=>{
    //   getTx();
    // })
    // .catch((e)=>{
    //   console.log(e);
    // })
  },[]);


  const [token, setToken] = useState('');
  const [syncClient, setSyncClient] = useState(null);
  const [inT, setIncomingList] = useState([]);
  const [outT, setOutgoingList] = useState([]);

  async function getAccessToken() {

    const res = await fetch(`http://localhost:3000/token`);
    const data = await res.json();
    console.log(data.token);
    var syncClient = new SyncClient(data.token);

    setToken(data.token);
    setSyncClient(syncClient);
    const incomingList = await syncClient.list('incoming');
    const outgoingList = await syncClient.list('outgoing');

    let inT = await incomingList.getItems();
    let outT = await outgoingList.getItems();

    setIncomingList(inT.items);
    setOutgoingList(outT.items);

    incomingList.on('itemAdded', event => {
      if (!event.isLocal) {
        console.log("item added", event);
        let newInT = inT.items;
        newInT.push(event.item);
        console.log(newInT);
        setIncomingList(newInT);
      }
    });

    incomingList.on('itemRemoved', event =>{
      if (!event.isLocal) {
        console.log("item removed", event);
      }
    });
    // console.log(inT, outT);  
  }




  return (
    <div className="App">
      <header className="App-header">
        <h1>Bucket #1: donation counter</h1>
        <div className="bucket">
          <div className="bucket-inT">
            {inT.map(i => (
              <div className="inT" style={{height:`${i.data.amount*2}px`}} key={i.uri}> {i.data.amount}</div>
            ))}
          </div>

          <div className="bucket-outT">
            {outT.map(i => (
              <div className="outT" style={{height:`${i.data.amount*2}px`}} key={i.uri}> {i.data.amount}</div>
            ))}
          </div>
        </div>
        
        

      </header>
    </div>
  );
}

export default App;
