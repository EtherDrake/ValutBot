var request = require('request'); //HTTP-запити
var cheerio = require('cheerio'); //Парсинг
var TelegramBot = require('node-telegram-bot-api');//Telegram-bot
var fs=require('fs');//Робота з файлами

var token = '655023513:AAElU5ZnMrIoBsmt4nlQOZ7xFPt6AivUjag';//Токен
var url = 'http://ok-finance.net.ua';//Сторінка, яка парситься

var bot = new TelegramBot(token, {polling: true});//створення бота
var USA_Flag='🇺🇸';
var EUR_Flag='🇪🇺';
var RUS_Flag='🇷🇺';
var POL_Flag='🇵🇱';
var CHF_Flag='🇨🇭';
var GBP_Flag='🇬🇧';
var Comm_course='💰';
var up = '↑';
var down = '↓';
var no_change = ' ';
var Flags = [USA_Flag, EUR_Flag, RUS_Flag, POL_Flag, GBP_Flag, CHF_Flag];
var ids = ['USD','EUR', 'RUB','PLN','GBP','CHF'];
var adminid=310694905;
var channel="@oktavarates";

var Rates = {
	"USD": [0.0, 0.0],
	"EUR": [0.0, 0.0],
	"RUB": [0.0, 0.0],
	"PLN": [0.0, 0.0],
	"GBP": [0.0, 0.0],
	"USD_Com": [0.0, 0.0],
	"EUR_Com": [0.0, 0.0],
	"RUB_Com": [0.0, 0.0],
	"PLN_Com": [0.0, 0.0]
};

var file = 'data.json';
loadFile();
setInterval(intervalFunc, 180000);// Перевірка наявності оновлень (900000 - 15 хв, 3600000 - 1 год)


function tabulate(string)
{
	while(string.length<5) string=' '+string;
	return string;
}

function loadFile()//Завантажити дані з файлу
{	
	let text = fs.readFileSync(file);
	Rates=JSON.parse(text);
} 





function getRates(callback)
{
	request({uri:url, method:'GET', encoding:'utf-8'},
		function (err, res, page) 
		{
			let $=cheerio.load(page);
			let content=$('div.exchange_table').eq(0);
			let table=content.children('.line');
			let message_table='';

			for(let i=0; i<5; i++)
          	{
          		let currency_name=table.eq(i).children('.currency_name').eq(0).text().substr(21,3).replace('\n','');
          		let buy_price=table.eq(i).children('.buy').eq(0).text().substr(21,6).replace('\n','').trim();
          		let sell_price=table.eq(i).children('.sell').eq(0).text().substr(21,6).replace('\n','').trim();

          		buy_price=tabulate(buy_price);

          		message_table+=Flags[ids.indexOf(currency_name)]+currency_name+" "+buy_price+" / "+sell_price+"\n";
          	}

          	let message="`"+message_table+"`";

          	callback(null, message);
    	}
    );
}

function getCommericalRates(callback)
{
	request({uri:url, method:'GET', encoding:'utf-8'},
		function (err, res, page) 
		{
			let $=cheerio.load(page);
			let content=$('div.commercial').eq(0).children('.exchange_table').eq(0);
			let table=content.children('.line');
			let message_table='';

			for(let i=0; i<4; i++)
          	{
          		let currency_name=table.eq(i).children('.currency_name').eq(0).text().substr(21,3).replace('\n','').trim();
          		let buy_price=table.eq(i).children('.buy').eq(0).text().substr(21,6).replace('\n','').trim();
          		let sell_price=table.eq(i).children('.sell').eq(0).text().substr(21,6).replace('\n','').trim();
          		buy_price=tabulate(buy_price);

          		message_table+=Flags[ids.indexOf(currency_name)]+currency_name+"  "+buy_price+" / "+sell_price+"\n";
          	}

          	let message="`"+message_table+"`";

          	callback(null, message);

		}
	);
}



function intervalFunc()
{
	request({uri:url, method:'GET', encoding:'utf-8'},
		function (err, res, page) 
		{
			let $=cheerio.load(page);
			let content=$('div.exchange_table').eq(0);
			let table=content.children('.line');

			let cur_rates={
				"USD": [0.0, 0.0],
				"EUR": [0.0, 0.0],
				"RUB": [0.0, 0.0],
				"PLN": [0.0, 0.0],
				"GBP": [0.0, 0.0],
				"USD_Com": [0.0, 0.0],
				"EUR_Com": [0.0, 0.0],
				"RUB_Com": [0.0, 0.0],
				"PLN_Com": [0.0, 0.0]
			};


			let trigger=false;

			for(let i=0; i<5; i++)
          	{          		
          		let buy_price=table.eq(i).children('.buy').eq(0).text().substr(21,6).replace('\n','').trim();
          		let sell_price=table.eq(i).children('.sell').eq(0).text().substr(21,6).replace('\n','').trim();          		

          		let key = Object.keys(cur_rates)[i];

          		cur_rates[key][0]=buy_price;
          		cur_rates[key][1]=buy_price;

          		if(cur_rates[key][0]!=Rates[key][0] || cur_rates[key][1]!=Rates[key][1])
          			trigger=true;          		
          	}

          	content=$('div.commercial').eq(0).children('.exchange_table').eq(0);
			table=content.children('.line');			

			for(let i=0; i<4; i++)
          	{          		
          		let buy_price=table.eq(i).children('.buy').eq(0).text().substr(21,6).replace('\n','').trim();
          		let sell_price=table.eq(i).children('.sell').eq(0).text().substr(21,6).replace('\n','').trim();          		

          		let key = Object.keys(cur_rates)[i+5];
          		cur_rates[key][0]=buy_price;
          		cur_rates[key][1]=buy_price;

          		if(cur_rates[key][0]!=Rates[key][0] || cur_rates[key][1]!=Rates[key][1])
          			trigger=true;          		
          	}

          	if(trigger)
          	{
          		let m_table="`";
          		for (let i=0; i<9; i++)
          		{
          			let key = Object.keys(cur_rates)[i];
          			let currency_name=key.substr(0,3);
          			m_table+=Flags[ids.indexOf(currency_name)]+currency_name;

          			if(cur_rates[key][0]<Rates[key][0]) m_table+="  " + down;
          			else if(cur_rates[key][0]>Rates[key][0]) m_table+="  " + up;
          			else m_table+="  " + no_change;
          			m_table+=tabulate(cur_rates[key][0])+" / ";

          			if(cur_rates[key][1]<Rates[key][1]) m_table+= down;
          			else if(cur_rates[key][1]>Rates[key][1]) m_table+= up;
          			else m_table+=no_change;
          			m_table+=cur_rates[key][1]+"\n";

          			if(i==4) m_table+="`\n"+Comm_course+"Коммерційний курс:\n`";
          		}

          		m_table+="`";
          		bot.sendMessage(channel, m_table, {parse_mode : "markdown"});
          		Rates=cur_rates;
          		fs.writeFileSync(file, JSON.stringify(Rates));
          	}
          	
		}
	);
}






bot.onText(/\/get/, function(msg, match) 
{ 
	let fromId = msg.from.id;//telegram id відправника
	getRates(function(err, msg){bot.sendMessage(fromId,msg,{parse_mode : "markdown"})});//Відправити пост          
});

bot.onText(/\/comm/, function(msg, match) 
{ 
	let fromId = msg.from.id;//telegram id відправника
	getCommericalRates(function(err, msg){bot.sendMessage(fromId,msg,{parse_mode : "markdown"})});//Відправити пост          
});