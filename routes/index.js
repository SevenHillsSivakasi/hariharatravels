var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();
var wbm = require('wbm');
var fs = require('fs');
var path = require('path');
const { ToWords } = require('to-words');
const toWords = new ToWords();
// var Xvfb = require('xvfb');

const multer  = require('multer')


var storage = multer.diskStorage({
  
  destination: function(req,file,cb){
      cb(null, './documents/');
    },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)) //Appending extension
  }
});

var fileFilterr = (req,file,cb) => {
  if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'application/pdf'){
    cb(null,true);
  }
  else{
    cb(null,false);
  }
}

var upload = multer({
  storage: storage, 
  limits:{fileSize: 1024 * 1024 * 5},
  fileFilter: fileFilterr
});

//Required package
var pdf = require("pdf-creator-node");
var fs = require("fs");

const accountSid = process.env.AUTH_SID;
const authToken = process.env.AUTH_TOKEN;

const client = require('twilio')(accountSid, authToken);

var Trip = require('../models/tripCalculator');
var TripPreset = require('../models/tripPresets');
const Garage = require('../models/garage');
const Ledger = require('../models/ledger');


/* GET home page. */
router.get('/', function(req, res, next) {

  Trip.find().then(
    (result)=>{
      // console.log(result);
      TripPreset.find().then(result1=>{
        Garage.find().then(result2=>{
          console.log(result2);
          res.render('index', { title: 'HariHara Travels', trips:result, presets:result1, garages:result2 });
        }).catch(err=>{console.log(err); return res.render('error')});
      }).catch(err=>{console.log(err); return res.render('error')});

    }).catch(err=>{console.log(err); return res.render('error')});
  
});

router.get('/garage', function(req,res,next){
  Garage.find()
  .then(result=>{
    res.render('garage', {title: 'Garage | Harihara Travels', garages:result});
  })
  
})

router.get('/addVehicle', function(req,res,next){
  res.render('addVehicle', {title: 'New Vehicle | Harihara Travels'});
})

router.post('/newVehicle', function(req,res,next){
  var garage = new Garage({
    
    name:req.body.vehicleName,
    seat:req.body.seat,
    
  })

 garage.save()
 .then(()=>{
  res.redirect('/');
  console.log("Success");
 })
 .catch((err)=>{
  console.log(err);
  res.redirect('/');
 })

})

router.get('/deleteVehicle/:id', function(req,res,next){
  var id = req.params.id;
  Garage.findByIdAndDelete(id)
  .then(()=>{
    res.redirect('/garage');
  })
  .catch(err=>{
    console.log(err);
    return res.redirect('/');
  })
})

router.post('/saveTrip', function(req,res,next){
  
  var tripID = "T-" + req.body.cusPhone.slice(6,10);
  
  var newTrip = Trip({
    tripID:tripID,
    dateFrom:req.body.startDate,
    dateTo:req.body.endDate,
    from:req.body.from,
    to:req.body.to,
    distance:req.body.expKMs,
    stay:req.body.tripDays,
    vehicleType:req.body.vehicleType,
    ac:req.body.acornot,
    perKM:req.body.ratePerKm,
    dayRent:req.body.dayRent,
    tripTariff:req.body.tripTariff,
    tollAmt:req.body.tollAmt,
    driverBata:req.body.driverBata * req.body.tripDays,
    hillCharge:req.body.hillCharge,
    permitAmount:req.body.permitCharge,
    estAmt:req.body.totalTariff,
    cusName:req.body.cusName,
    cusAdd:req.body.cusAdd,
    cusPhone:req.body.cusPhone,
    cusPP:req.body.cusPP,
    amountInWords:toWords.convert(req.body.totalTariff, { currency: true })
  });

  newTrip.save()
  .then((result)=>{
    res.redirect('/');
  })
  .catch((err)=>{
    console.log("The Error is " + err);
    res.redirect('/');
  })


})

router.get('/newTrip', function(req,res,next){
  res.render('newTrip', {title: 'New Trip | Harihara Travels', preset:{}});
})

router.post('/updateTrip/:id', function(req,res,next){
  var id = req.params.id;

  var startingKm = req.body.startingKm;
  var endingKm = req.body.endingKm;
  var actTotalKms = req.body.actualKms;
  var actDayRent = req.body.actDayRent;
  var actDriverBata = req.body.actDriverBata;
  var actToll = req.body.actualToll;
  var actAdvAmt = req.body.advAmt;
  var actTotalTripFare = req.body.tripFare;
  var actBalTripFare = req.body.balTripFare;

  console.log(actTotalKms,actTotalTripFare, actBalTripFare, actAdvAmt);

  Trip.findByIdAndUpdate(
    {_id:id},
    {$set : {
      startingKm : startingKm,
      endingKm : endingKm,
      tripOver:"Yes",
      distance:actTotalKms,
      dayRent:actDayRent,
      driverBata:actDriverBata,
      tollAmt:actToll,
      advanceAmt:actAdvAmt,
      totalTripAmt:actTotalTripFare,
      balanceAmt:actBalTripFare
    }}
  )
  .then((result)=>{
    res.redirect('/');
  })
  .catch((err)=>{
    console.log("The Error is " + err);
    return res.redirect('/');
  })

})

router.post('/confirmTrip/:id', function(req,res,next){
  var id = req.params.id;
  var advAmount = req.body.advAmount;

  Trip.findByIdAndUpdate(id,
    {
      $set: {
        advanceAmt:advAmount,
        tripConfirmed:"confirmed",
      }
    })
    .then(result=>{
      res.redirect('/');
    })
    .catch(err=>{
      console.log("Error Message : " + err);
      res.redirect('/');
    })

})

router.post('/assignDriver/:id', function(req,res,next){
  var id = req.params.id;
  Trip.findByIdAndUpdate(id,
    {$set:{
      driverName:req.body.driverName,
      driverNum:req.body.driverNum,
      driverAssigned:1
    }})
    .then(()=>{
      res.redirect('/');
    })
    .catch(error=>{
      console.log("Error Message  :" + error);
      res.redirect('/');
    })
})

router.post('/assignVehicle/:id', function(req,res,next){
  var id = req.params.id;

  Trip.findByIdAndUpdate(id,
    {$set:{
      vehicleNo:req.body.vehicleSelection,
      vehicleAssigned:1
    }})
    .then(()=>{
      res.redirect('/');
    })
    .catch(error=>{
      console.log("Error Message  :" + error);
      res.redirect('/');
    })

})

router.get('/tripOver/:id', function(req,res,next){
  
  var idValue = req.params.id;
  Trip.findById({_id:idValue})
  .then(result => {
    res.render('closeTrip', {title: 'Close Trip | Harihara Travels', trip:result});
  })
  .catch(err=>{
    console.log(err);
    return res.redirect('/');
  })

})

router.post('/paymentUpdate/:id', function(req,res,next){
  var id = req.params.id;
  Trip.findById(id)
  .then(result=>{
    var pendingPayment = Number(result.balanceAmt);
    var receivedPayment = Number(req.body.pendingPayment);
    var balance = pendingPayment - receivedPayment;
    var updatedAdvance = result.advanceAmt + receivedPayment;
    console.log("The Balance is " + balance);
    if(balance <= 0){
      Trip.updateOne({_id:result._id},{$set:{closeTrip:"Yes", paymentDone:"Yes", balanceAmt:0}})
      .then(()=>{res.redirect('/');})
      .catch(err=>{console.log(err); res.redirect('/')});
    }
    else{
      Trip.updateOne({_id:result._id},{$set:{advanceAmt : updatedAdvance, balanceAmt:balance}})
      .then(()=>{res.redirect('/');})
      .catch(err=>{console.log(err); res.redirect('/')});
    }

  })
})

// router.get('/paymentDone/:id', function(req,res,next){
  
//   var idValue = req.params.id;
//   Trip.findByIdAndUpdate(
//     {_id:idValue},
//     {$set: {
//       paymentDone:"Yes"
//     }}
//     )
//   .then(result => {
//     return res.redirect('/');
//   })
//   .catch(err=>{
//     console.log(err);
//     return res.redirect('/');
//   })

// })

router.get('/tripDeletion/:id', function(req,res,next){
  var id = req.params.id;
  Trip.deleteOne({_id:id})
  .then(()=>{
    return res.redirect('/');
  })
  .catch((err)=>{
    console.log("The Error is " + err);
    return res.redirect('/');
  })
})

router.get('/history', function(req,res,next){
  Trip.find({paymentDone:"Yes"})
  .then(result => {
    console.log(result)

    Garage.find()
    .then(resultt=>{  
      res.render('tripHistory', {title: "Trip History | Harihara Travels", trips:result,garages:resultt});
    })

    
  })
  .catch(err =>{
    console.log("The Error is " + err);
    return res.redirect('/');
  })
})

router.get('/tripPreset', function(req,res,next){
  TripPreset.find()
  .then(result => {
    res.render('tripPreset',{title: 'Trip Presets | Harihara Travels', presets:result});
  })
  .catch(error=>{
    console.log(error);
    return res.redirect('/');
  })
  
})

router.post('/newTripPreset', function(req,res,next){

  var newTripPreset = TripPreset({
    destination:req.body.tripDetail,
    expKms:req.body.expKms,
    from:req.body.from,
    to:req.body.to
  });


  newTripPreset.save()
  .then(result=>{
    console.log(result);
    return res.redirect('/tripPreset');
  })
  .catch(error=>{
    console.log(error);
    return res.redirect('/');
  })

})

router.post('/updatePreset/:id', function(req,res,next){
  var id = req.params.id;

  TripPreset.findByIdAndUpdate(
    {_id:id},
    {$set: {
      destination:req.body.newTripDetail,
      expKms:req.body.newExpKms
    }}
    )
    .then(result=>{
      return res.redirect('/tripPreset');
    })
    .catch(error=>{
      console.log(error);
      return res.redirect('/');
    })
})

router.get('/deletePreset/:id', function(req,res,next){
  var id = req.params.id;

  TripPreset.findByIdAndDelete(
    {_id:id}
    )
    .then(result=>{
      return res.redirect('/tripPreset');
    })
    .catch(error=>{
      console.log(error);
      return res.redirect('/');
    })
})

router.post('/newTripFromPreset', function(req,res,next){
  var tripID = req.body.presetTripSelected;

  TripPreset.findById({_id:tripID})
  .then(result=>{
    res.render('newTrip',{title:'New Trip | Harihara Travels', preset:result});
  })
  
})

router.get('/alert/:id', function(req,res,next){

  var id=req.params.id;
  Trip.findById(id)
  .then(result=>{

     client.messages
  .create({
    body: "Greetings:" + '\n' + "Welcome to Harihara Travels" + '\n' + "Trip Details:" + '\n' + "From: " + result.from + '\n' + "To: " + result.to + '\n' +  "Driver: " + result.driverName + '\n' +  "Contact: " + result.driverNum + '\n' + "Have a Safe Journey.",
    to: '+916383841383', // Text your number
    from: '+13614207879', // From a valid Twilio number
  })
  .then((message) => console.log(message.sid),  res.redirect('/'))
  .catch(err=>{console.log(err)});


  })

  

})

router.get('/expenses', function(req,res,next){
  Trip.find({
    $and: [
        {closeTrip: "Yes"},
        {paymentDone: "Yes"}
    ]
    })
    .then(result=>{
      
      Garage.find()
      .then(garages=>{
        if(req.session.admin === true){
          res.render('expenses',{trips:result, garages:garages, title:'Dashboard | Harihara Travels'})
        }
        else{
          res.redirect('/login');
        }
        
      })
      .catch(err=>console.log("Garage Error :" + err ));
      
      
    })
})

router.post('/tripsList', function(req,res,next){
  
  Trip
  .find(
        {
          $and: [
            {closeTrip: "Yes"},
            {paymentDone: "Yes"}
        ],
          date: {
            $gte: req.body.from,
            $lt: req.body.to
        } }
     
   )
   .then((result)=>{
    console.log(result);

    // var debitValue = 0;
    // var creditValue = 0;
    // var netProfit = 0;

    // result.forEach(entry=>{
    //   debitValue += Number(entry.debit);
    //   creditValue += Number(entry.credit);
    // })

    // netProfit = creditValue - debitValue;

    res.render('tripsTally',{title:'Trips Tally | Harihara Travels', trips:result, from:req.body.from, to:req.body.to});
  })

})

router.post('/getTripList', function(req,res,next){
  var vehicle = req.body.vehicle;
  var from = req.body.from;
  var to = req.body.to;

  Trip.find({

    $and:[

      {dateFrom:{
        $gte:from,
        $lt:to
      }},
      {
        vehicleNo:vehicle}
    ]
   
})
  .then(result=>{

    var totalKms = 0;
    var totalTripAmt = 0;

    result.forEach(trip=>{
      totalKms = 0 + Number(trip.distance);
      totalTripAmt = 0 + Number(trip.totalTripAmt);
    })

    res.render('vehicleTripReport',{title:'Vehicle Trips Report',trips:result, vehicle:vehicle, dateFrom:from, dateTo:to, totalKms:totalKms, totalTripAmt:totalTripAmt});
  })

})

router.post('/expenseUpdate/:id', function(req,res,next){
  var id = req.params.id;

  Trip.find({_id:id})
  .then(result=>{
    var driverBata = Number(req.body.driverBata);
    var expDiesel = Number(req.body.dieselCost);
    var tollAmt = Number(req.body.tollAmt);
    var driverPadi = Number(req.body.driverPadi);
    var miscExp = Number(req.body.miscExp);
    var tripExpenses = driverBata + expDiesel + tollAmt + driverPadi + miscExp;
    var netProfit = Number(req.body.totalTripAmount) - Number(tripExpenses);


    // console.log(req.body.totalTripAmount);
    // console.log("expDiesel: " + expDiesel);
    // console.log("Toll Amount: " + tollAmt);
    // console.log("Misc Exp: " + miscExp);
    // console.log("Driver Padi  : " + driverPadi);
    // console.log("tripExpenses: " + tripExpenses);
    // console.log(netProfit);

    Trip.findByIdAndUpdate(id, {
      $set : {
        driverBata: req.body.driverBata,
        driverPadi: req.body.driverPadi,
        expDiesel: req.body.dieselCost,
        tollAmt:req.body.tollAmt,
        tripExpenses:tripExpenses,
        netProfit:netProfit,
        expUpdated:"Yes"
      }
    })
    .then(()=>{

      Trip.findById(id)
      .then((resultt)=>{

        var newLedger = Ledger({
          vehicle:resultt.vehicleNo,
          ledgerDate: new Date(),
          particulars:"Trip Net Profit :" + netProfit,
          details: resultt.from + "-" + resultt.to + "-" + resultt.cusPhone,
          credit:netProfit
        })
        
        newLedger.save().then(()=>{
          console.log("Hit");
          res.redirect('/history');
        })
        .catch(err=>{console.log(err); return res.redirect('/')});


      })

    
      
    })

  })
  .catch(err=>{
    console.log("the Error is " + err);
    return res.redirect('/');
  })

  
  
})

router.get('/maintenance', function(req,res,next){
  Garage.find()
  .then(result=>{

    Ledger.find()
    .then(resultt=>{
      console.log(resultt);
      res.render('maintenance',{title:'Maintenance | Harihara Travels', garages:result, ledger:resultt});
    })

  })
})

router.post('/newLedgerEntry', upload.single('billCopy'), function(req,res,next){
  var ledgerDate = req.body.ledgerDate;
  var vehicleSelected = req.body.vehicleSelected;
  var particulars = req.body.particulars;
  var details = req.body.details;
  var credit = req.body.ledgerCredit;
  var debit = req.body.ledgerDebit;
  var billCopy = req.file.path;

  var newLedgerEntry = new Ledger({
    vehicle:vehicleSelected,
    ledgerDate:ledgerDate,
    particulars:particulars,
    details:details,
    credit:credit,
    debit:debit,
    billCopy:billCopy
  })

  newLedgerEntry.save().then(()=>{res.redirect('/maintenance')}).catch(err=>{console.log(err); return res.redirect('/')});

})

router.post('/getLedger', function(req,res,next){
  
  var vehicleID = req.body.vehicle; 
  var vehicleName = req.body.garageName;
  // console.log(vehicleID, vehicleName, req.body.from, req.body.to);

  Ledger
  .find(
    
        {
          'name': vehicleID,
          ledgerDate: {
            $gte: req.body.from,
            $lt: req.body.to
        } }
     
   )
   .then((result)=>{
    console.log(result);

    var debitValue = 0;
    var creditValue = 0;
    var netProfit = 0;

    result.forEach(entry=>{
      debitValue += Number(entry.debit);
      creditValue += Number(entry.credit);
    })

    netProfit = creditValue - debitValue;

    res.render('ledgerReport',{title:'Report | Harihara Travels', entries:result, 
    totalCreditValue:creditValue, totalDebitValue:debitValue, netProfitValue:netProfit, vehicleName:vehicleName, from:req.body.from, to:req.body.to});
  })

})

router.get('/checkAvailability', function(req,res,next){
  Garage.find()
  .then(result=>{
    res.render('checkAvailability',{title:'Harihara Travels', garage:result, tripsList:{}});
  })
})

router.post('/getUpcomingTrips', function(req,res,next){
  
  var vehicle = req.body.vehicle;
  var from = req.body.from;
  var to = req.body.to;

  Trip.find({

    $and:[

      {dateFrom:{
        $gte:from,
        $lt:to
      }},
      {
        vehicleNo:vehicle},
      {
        tripOver:"No"
      }
    ]
   
  })
  .then(result=>{
    console.log(result);
    Garage.find()
    .then(resultt=>{
      res.render('checkAvailability',{title:'Harihara Travels', tripsList:result,garage:resultt,vehicle:vehicle, fromDate:from, toDate:to});
    })
    
  })

})

// router.get('/generateEstimate/:id', function(req,res,next){
//   var id = req.params.id;
//   Trip.findById(id)
//   .then((result)=>{
//     console.log(result.vehicleNo);
//     Garage.find(
//       {name:result.vehicleNo}).then(veh=>{
//       console.log(veh);
//       var fileName = './result.pdf';
  
//       res.render('estimateGenerator', {bill:result, vehicleName:veh.name, seat:veh.seat}, function(err,html){
        
//         if(err){
//           return console.log(err);
//         }
  
//       (async () => {
  

//         // Xvfb.startSync((err)=>{if (err) console.error(err)});
      
//         const PCR = require("puppeteer-chromium-resolver");
//         const puppeteer = require('puppeteer');
//         const option = {
//           revision: "",
//           detectionPath: "",
//           folderName: ".chromium-browser-snapshots",
//           defaultHosts: ["https://storage.googleapis.com", "https://npm.taobao.org/mirrors"],
//           hosts: [],
//           cacheRevisions: 2,
//           retry: 3,
//           silent: false
//       };
  
//       const stats = PCR.getStats(option);

  
//       if(stats){
//         const browser = await stats.puppeteer.launch({
//             headless:false,
//             args: ['--no-sandbox','--disable-setuid-sandbox'],
//             executablePath: stats.executablePath
//           }); 
  
//             // create a new page
//             const page = await browser.newPage();
  
//             // Configure the navigation timeout
//             await page.setDefaultNavigationTimeout(0);
  
//            await page.setCacheEnabled(false); 
//            // set your html as the pages content
            
//             await page.setContent(html, {
//               waitUntil: 'domcontentloaded'
//             })
//             await page.emulateMediaType('screen');
    
//         // create a pdf buffer
//             const pdfBuffer = await page.pdf({
//               format: 'A4',
//               path: fileName,
//               printBackground:true
//             })
  
//             console.log('done');
//             res.header('content-type','application/pdf');
//             res.send(pdfBuffer);
  
//         // close the browser
//             await browser.close();
  
  
  
//       }
//       else{
  
//         const stats = await PCR(option);
//         const browser = await stats.puppeteer.launch({
//             headless:false,
//             args: ['--no-sandbox','--disable-setuid-sandbox'],
//             executablePath: stats.executablePath
//           }); 
     
//         // launch a new chrome instance
//           // create a new page
//           const page = await browser.newPage();
  
//           // Configure the navigation timeout
//           await page.setDefaultNavigationTimeout(0);
  
//          await page.setCacheEnabled(false); 
//          // set your html as the pages content
          
//           await page.setContent(html, {
//             waitUntil: 'domcontentloaded'
//           })
//           await page.emulateMediaType('screen');
  
//       // create a pdf buffer
//           const pdfBuffer = await page.pdf({
//             format: 'A4',
//             path: fileName,
//             printBackground:true
//           })
  
//           console.log('done');
//           res.header('content-type','application/pdf');
//           res.send(pdfBuffer);
  
//       // close the browser
//           await browser.close();
//       }
     
       
           
    
      
    
//     })().catch((error) =>{
//       console.error("the message is " + error.message);
//     });
  
//   })
  

//     }).catch(err=>{
//       console.log(err);
//     })

      
   
// }).catch(err=>{
//   console.log("The Error is " + err);
// })
//     })

// router.get('/generateBill/:id', function(req,res,next){
//       var id = req.params.id;
//       Trip.findById(id)
//       .then((result)=>{
//         console.log(result.vehicleNo);
//         Garage.find(
//           {name:result.vehicleNo}).then(veh=>{
//           console.log(veh);
//           var fileName = './result.pdf';
      
//           res.render('billGenerator', {bill:result, vehicleName:veh.name, seat:veh.seat}, function(err,html){
            
//             if(err){
//               return console.log(err);
//             }
      
//           (async () => {
      
    
//             // Xvfb.startSync((err)=>{if (err) console.error(err)});
          
//             const PCR = require("puppeteer-chromium-resolver");
//             const puppeteer = require('puppeteer');
//             const option = {
//               revision: "",
//               detectionPath: "",
//               folderName: ".chromium-browser-snapshots",
//               defaultHosts: ["https://storage.googleapis.com", "https://npm.taobao.org/mirrors"],
//               hosts: [],
//               cacheRevisions: 2,
//               retry: 3,
//               silent: false
//           };
      
//           const stats = PCR.getStats(option);
    
      
//           if(stats){
//             const browser = await stats.puppeteer.launch({
//                 headless:false,
//                 args: ['--no-sandbox','--disable-setuid-sandbox'],
//                 executablePath: stats.executablePath
//               }); 
      
//                 // create a new page
//                 const page = await browser.newPage();
      
//                 // Configure the navigation timeout
//                 await page.setDefaultNavigationTimeout(0);
      
//                await page.setCacheEnabled(false); 
//                // set your html as the pages content
                
//                 await page.setContent(html, {
//                   waitUntil: 'domcontentloaded'
//                 })
//                 await page.emulateMediaType('screen');
        
//             // create a pdf buffer
//                 const pdfBuffer = await page.pdf({
//                   format: 'A4',
//                   path: fileName,
//                   printBackground:true
//                 })
      
//                 console.log('done');
//                 res.header('content-type','application/pdf');
//                 res.send(pdfBuffer);
      
//             // close the browser
//                 await browser.close();
      
      
      
//           }
//           else{
      
//             const stats = await PCR(option);
//             const browser = await stats.puppeteer.launch({
//                 headless:false,
//                 args: ['--no-sandbox','--disable-setuid-sandbox'],
//                 executablePath: stats.executablePath
//               }); 
         
//             // launch a new chrome instance
//               // create a new page
//               const page = await browser.newPage();
      
//               // Configure the navigation timeout
//               await page.setDefaultNavigationTimeout(0);
      
//              await page.setCacheEnabled(false); 
//              // set your html as the pages content
              
//               await page.setContent(html, {
//                 waitUntil: 'domcontentloaded'
//               })
//               await page.emulateMediaType('screen');
      
//           // create a pdf buffer
//               const pdfBuffer = await page.pdf({
//                 format: 'A4',
//                 path: fileName,
//                 printBackground:true
//               })
      
//               console.log('done');
//               res.header('content-type','application/pdf');
//               res.send(pdfBuffer);
      
//           // close the browser
//               await browser.close();
//           }
         
           
               
        
          
        
//         })().catch((error) =>{
//           console.error("the message is " + error.message);
//         });
      
//       })
      
    
//         }).catch(err=>{
//           console.log(err);
//         })
    
          
       
//     }).catch(err=>{
//       console.log("The Error is " + err);
//     })
//         })



router.get('/generateEstimate/:id', function(req,res,next){

   var id = req.params.id;
  Trip.findById(id)
  .then((result)=>{
    console.log(result.vehicleNo);
    Garage.find(
      {name:result.vehicleNo}).then(veh=>{
      console.log(veh);
      var fileName = './result.pdf';
      res.render('estimateGenerator', {bill:result, vehicleName:veh.name, seat:veh.seat}, function(err,html){

        var document = {
          html: html,
          data:{
            
          },
          path: "./output.pdf",
          type: "",
          };

          var options = {
            format: "A4",
            orientation: "portrait",
            }
        
            // var fileName = './estimates/estimate-' + result.tripID + '.pdf';

            pdf.create(document,options)
            .then((ress)=>{
              console.log(ress);
              

              var data =fs.readFileSync('./output.pdf');
              res.contentType("application/pdf");
              res.send(data);
  
              
            })
              .catch(err=>{
                return console.log(err);
              })

      
    })
})

})

})

router.get('/login', function(req,res,next){
  if(req.session.admin === true){
    res.redirect('/expenses');
  }
  else{
    res.render('login',{title:'Login | Harihara Travels', message:""});
  }
   
})

router.post('/login', function(req,res,next){
  var username = req.body.loginUserName;
  var password = req.body.loginPassword;

  if(username === process.env.LOGIN_USERNAME && password === process.env.LOGIN_PASSWORD){
    req.session.admin = true;
    res.redirect('/expenses');
  }
  else{
    var message = "Either Username or Password is not Correct."
    res.render('login',{title:'Login | Harihara Travels', message:message});
  }
 
})

router.get('/logout', function(req,res,next){
  req.session.admin = false;
  res.redirect('/login');
})



module.exports = router;

