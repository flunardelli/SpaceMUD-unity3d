enum Cmds { examinar, pegar, largar, item, usar, falar, cochichar, ajuda }
enum NetworkCmds { conectar, disconectar }

enum Moves { norte, sul, leste, oeste }
enum GameStatus { Disconnected, Connected, Login, GameOver, Complete }
enum ClientFunctions { Console, SetCurrentPosition, SetRoomStatus, SetTimer, SetGameStatus }

var MSG_INVALID_MOVE = "Invalid movement.";	
var MSG_UNKNOW_CMD = "Invalid command";
var MSG_AVAIL_ROOMS = "Available rooms";
var MSG_ROOM_LOCKED = "Locked room";
var MSG_ITEM_PICKED = "Item acquired";
var MSG_ITEM_DROPPED = "Dropped item";
var MSG_ITEM_INVALID = "Invalid item";	
var MSG_ITEM_CURRENT = "Current item";	
var MSG_ITEM_USED = "Item was used";
var MSG_ITEM_NOTUSED = "Item cant be used";
var MSG_ROOM_NOITEM = "There is no item in this room ";
				
var MSG_ITEM_ROOMFULL = "This room is full. Search another room to drop this item.";	
var MSG_PLAYER_NOITEM = "No item";
var MSG_ROOM_THEREISITEM = "There is an item";
var MSG_PLAYER_INVENTORYFULL = "Can not grap more items";
var MSG_ROOM_PLAYERS = "There is anyone else in this room";
var MSG_PLAYER_MOVED = "Moved";

var MSG_PLAYER_WELCOME = "Starting";

var MSG_HELP = "Para movimentar-se no mapa, clique em uma das setas e aperte <enter>.\nPara examinar uma sala, clique em examinar e aperte <enter> ou digite “examinar” no console e aperte <enter>.\nPara pegar um item na sala clique em pegar ou digite “pegar”. Em seguida, digite o nome do item desejado e aperte <enter>.\nPara largar um item, digite “largar” ou clique no botão largar. Em seguida digite o nome do item que deseja largar e aperte <enter>.\nPara verificar qual item esta carregando, digite “item” ou clique em Item e aperte <enter>.\nPara utilizar um item, digite “usar” ou clique no botão usar e aperte <enter>.\nPara falar com outros jogadores que estão na mesma sala, digite “falar” ou selecione o botão falar, depois digite o que desejar e aperte <enter>.\nPara falar com um jogador em particular, digite “cochichar” ou aperte o botão cochichar, logo em seguida digite o nome do jogador e depois a mensagem que deseja enviar e aperte <enter>.";		
var players = new Array();
var player : Player;
var map : Map;

var client : Client;
var startTime;

@RPC
function ReturnMsg (msg : String)
{
	Debug.Log("ReturnMsg -> "+msg);
   client = gameObject.GetComponent(Client);  
   var cmds = msg.Split("|"[0]);
   
   if (cmds[0] == ClientFunctions.Console.ToString()) {
   		client.Console(cmds[1]);
   } else if (cmds[0] == ClientFunctions.SetCurrentPosition.ToString()){
   		client.SetCurrentPosition(parseInt(cmds[1]),parseInt(cmds[2]));   
   } else if (cmds[0] == ClientFunctions.SetRoomStatus.ToString()){
   		client.SetRoomStatus(parseInt(cmds[1]),parseInt(cmds[2]), cmds[3]);   
   } else if (cmds[0] == ClientFunctions.SetTimer.ToString()){
   		client.SetTimer(parseInt(cmds[1]));   
   } else if (cmds[0] == ClientFunctions.SetGameStatus.ToString()){
   		client.SetGameStatus(parseInt(cmds[1]));   
   }
}

@RPC
function SendMsg (msg : String, info : NetworkMessageInfo)
{
	player = getPlayer(info.sender); 
	var m : String = ClientFunctions.Console.ToString()+"|"+ProcessMsg(msg);                                     
    networkView.RPC("ReturnMsg",info.sender,m); 
    //Debug.Log("SendMsg -> to: "+info.sender +" msg: " + m);    
}


function getPlayer(networkPlayer : NetworkPlayer) : Player {
	
	var player : Player = null;
	for (var p : Player in players) {
		if (p.networkplayer == networkPlayer){
			player = p; 
			break;
		}
	} 
	
	if (player == null){
		player = new Player();
    	player.name = null;
    	player.networkplayer = networkPlayer;
    	player.room = map.initialRoom;    
    	players.Add(player);				    		
	}	
	
	return player;
}

function removePlayer(networkPlayer : NetworkPlayer) {
	
	for (var i=0; i < players.length; i++) {
	 	var p : Player = players[i];
		if (p.networkplayer == networkPlayer){
			if (p.inventory != null && p.room.provides == null){
				p.room.provides = p.inventory;
			} else if (p.inventory != null) {
				for (var r : Room in map.rooms){
					if (r.status == "open" && r.provides == null) {
						r.provides = p.inventory;
						break;
					}					
				}
			}
			players.RemoveAt(i);			
			break;
		}
	}
	
}

function getPlayer(name : String) : Player {
	
	var player : Player = null;
	for (var p : Player in players) {
		if (p.name == name){
			player = p; 
			break;
		}
	} 
		
	return player;
}

function ProcessMsg(cmdline : String) : String {

	var cmds = new Array();
	cmds = cmdline.Split(" "[0]);
	var cmd : String = cmds.Shift();

	var msg : String = "";
	var msgt : String = "";
	
	var item : String = cmds.join(" ");
	
	switch(cmd){

        case NetworkCmds.conectar.ToString() :
        	if (player.name == null){
        		player.name	= cmds[0];
        	}
            
            sendSetCurrentPosition(player);
            
            if (player.room.timer) {
            	if (startTime == null) {             		
            		startTime = Time.time + parseInt(player.room.timer);            		
            	}
            	
            	sendSetTimer(player.room.timer);
            }
            
            
            
            if (player.room.image) {            	
            	msg = Resources.Load(player.room.image, TextAsset).text + "\n";
            }
            
            if (player.room.success) {
            	msg += MSG_PLAYER_WELCOME + " " + player.name + "\n";
            	msg += player.room.success + "\n";
            	
            }
                                
            
            break;            
            
		case Cmds.examinar.ToString() :
			
			msg = player.room.name + "\n";
			
			if (player.room.status == "closed") {
				msg += MSG_ROOM_LOCKED + "\n"; 
				break;
			}
			
			var playersCurrentRoom = new Array();
			for (var p : Player in players){
				if (p.room == player.room){
					playersCurrentRoom.Add(p.name);
				}
			}

			
			msg += player.room.description + "\n";
			if (playersCurrentRoom.length > 1) {
				msg += MSG_ROOM_PLAYERS + ": " + playersCurrentRoom.join(", ") + "\n";				
			}
			
			if (player.room.provides == null){
				msg += MSG_ROOM_NOITEM + "\n";
			} else {
				msg += MSG_ROOM_THEREISITEM + ": " + player.room.provides + "\n";
			}		
			
			break;
		case Cmds.pegar.ToString() :
			if (player.inventory != null){
				msg += MSG_PLAYER_INVENTORYFULL + "\n";
			} else if (player.room.status != "closed" && player.room.provides != null) {
				item = player.room.provides;
				player.inventory = item;
				player.room.provides = null;
				msg += MSG_ITEM_PICKED + " - " + item + "\n";
				
			} else {
				msg += MSG_ITEM_INVALID + "\n";
			}
			
			break;
		case Cmds.largar.ToString() :
			
			if (player.inventory == null){
				msg += MSG_PLAYER_NOITEM + "\n";
			} else if (player.room.provides != null) {
				msg += MSG_ITEM_ROOMFULL + "\n";
			} else {				
				player.room.provides = player.inventory;
				player.inventory = null;
				msg += MSG_ITEM_DROPPED + " - " + player.room.provides + "\n";
			}
			
			break;	
		case Cmds.item.ToString() :
			
			if (player.inventory == null){
				msg += MSG_PLAYER_NOITEM + "\n";
			} else {
				msg += MSG_ITEM_CURRENT + " - " + player.inventory + "\n";
			}
			
			break;	
		case Cmds.usar.ToString() :
			
			if (player.inventory == null){
				msg += MSG_PLAYER_NOITEM + "\n";
			} else if (player.inventory == player.room.requires) {
				msg += MSG_ITEM_USED + "\n";
				
				if (player.room.image) {            	
            		msg += Resources.Load(player.room.image, TextAsset).text + "\n";
            	}
            	if (player.room.success) {
					msg += player.room.success + "\n";
				}
					
				if (player.room.status == "closed") {
					player.room.status = "open";
					
					if (player.room.complete != null) {
						Debug.Log('Game Complete');
						startTime = null;
						status = GameStatus.Complete;
						sendSetGameStatus(status);						
						return;						
					}										
					
					if (player.room.timer) {
            			startTime = Time.time + parseInt(player.room.timer);            			
            			sendSetTimer(player.room.timer);           			
					}
					
					map.UpdateRoomStatus(player.room, player.room.status);				
					sendSetRoomStatus(player);
            
				} //else if (player.room.status == "open") {
				//	player.room.status = "closed";
				//}
				
				
				
			} else {
				msg += MSG_ITEM_NOTUSED + "\n";
			}			
			
			break;			
		case Moves.norte.ToString():; 
		case Moves.sul.ToString():; 
		case Moves.oeste.ToString():; 
		case Moves.leste.ToString():
        	
        	var room = map.Move(player.room, cmd);
        	
        	if (player.room.status == "closed" && room != player.lastroom){
        		room = null;
        	}
        	
        	if (room) {        		
	        	player.lastroom = player.room;
	        	player.room = room;
        		sendSetCurrentPosition(player);
        		msgt = MSG_PLAYER_MOVED + " " + cmd;
        		sendConsoleMsg(msgt, null, false, false);
        		
        	} else {
        		msg = MSG_INVALID_MOVE;
        	}
        
        	break;
        
        case Cmds.cochichar.ToString():;
        	var dest : String;
        	if (cmds.length >= 2) {
        		dest = cmds.Pop();
        	}        	
        case Cmds.falar.ToString():;
        	msgt = cmds.join(" ");
			sendConsoleMsg(msgt, dest, true, true);
        	break;
        case Cmds.ajuda.ToString():;       
        	msg = MSG_HELP;        	
        	break;        
        default:			
			msg = MSG_UNKNOW_CMD;		
            break;
    }
    
    return msg;
}

function sendConsoleMsg(m : String, dest : String, samesender, sameroom ){
	for (var p : Player in players){
		var useDest = (dest == null) ? true : (getPlayer(dest).networkplayer == p.networkplayer);
		var useRoom = (sameroom == false) ? true : (p.room == player.room);
		var useSender = (samesender == false) ? true : (player.networkplayer != p.networkplayer);
		if (useDest && useRoom && useDest){
			networkView.RPC("ReturnMsg",p.networkplayer,ClientFunctions.Console.ToString()+"|Mensagem de " + player.name + ": " + m);
		}
	}
}

function sendSetCurrentPosition(player : Player) {
	networkView.RPC("ReturnMsg",player.networkplayer,ClientFunctions.SetCurrentPosition.ToString() + "|" + player.room.x + "|" + player.room.y + "|" + player.room.status);
}


function sendSetRoomStatus(player : Player) {
	for (var p : Player in players){
		networkView.RPC("ReturnMsg",p.networkplayer,ClientFunctions.SetRoomStatus.ToString() + "|" + player.room.x + "|" + player.room.y + "|" + player.room.status);
	}
}

function sendSetTimer(timer : int) {
	
	for (var p : Player in players){
		Debug.Log("SendTimer: "+timer + " p: "+ p.networkplayer);	
		networkView.RPC("ReturnMsg",p.networkplayer,ClientFunctions.SetTimer.ToString() + "|" + timer);	
	}
}

function sendSetGameStatus(status : int) {
	for (var p : Player in players){	
		networkView.RPC("ReturnMsg",p.networkplayer,ClientFunctions.SetGameStatus.ToString() + "|" + status);	
	}
}

function InitGame () {
    var textAsset:TextAsset =  Resources.Load("map", TextAsset);
    map = new Map(textAsset);   
}


class Map {
	
	var rooms = new Array();	
	var initialRoom : Room = null;
		
	function Map(textAsset) {
		var parser = new XMLParser(); 
		var node:XMLNode = parser.Parse(textAsset.text);
	
		var arr:XMLNodeList=node.GetNodeList("map>0>objectgroup>0>object");		
	
		for (var e :XMLNode in arr){
			var room = new Room();
			room.name = e["@name"];		
			room.width = parseInt(e["@width"]);
			room.height = parseInt(e["@height"]);
			room.x = parseInt(e["@x"]);
			room.y = parseInt(e["@y"]);		
			//room.description = e["@description"];
			
			var arrp:XMLNodeList = e.GetNodeList("properties>0>property");
			
			for (var ee :XMLNode in arrp) {
				//Debug.Log("name " + ee["@name"] + " -> " + "value: " + ee["@value"]);
				if (ee["@name"] == "requires") {
					room.requires = ee["@value"];
				} else if (ee["@name"] == "provides") {
					room.provides = ee["@value"];
				} else if (ee["@name"] == "description"){
					room.description = ee["@value"];
					room.description = room.description.Replace("\\n","\n");
				} else if (ee["@name"] == "status"){
					room.status = ee["@value"];
				} else if (ee["@name"] == "success"){
					room.success = ee["@value"];
					room.success = room.success.Replace("\\n","\n");
				} else if (ee["@name"] == "audio"){
					room.audio = ee["@value"];
				} else if (ee["@name"] == "image"){
					room.image = ee["@value"];
				} else if (ee["@name"] == "timer"){
					room.timer = parseInt(ee["@value"]);
				} else if (ee["@name"] == "complete"){
					room.complete = ee["@value"];
				}
			}
			
			rooms.Push(room);
			
			if (!initialRoom) {
				initialRoom = room;
			}
			
		}
	}

	function Move(origin:Room,coord) : Room {
		var room : Room = null;
		
		var newx = origin.x;
		var newy = origin.y;
	
		//Debug.Log("x: " +player.x + " y: " + player.y + " commando " +coord);
		
		if (coord == Moves.norte.ToString()) {
			newy = origin.y - 10;			 
		} else if ( coord == Moves.sul.ToString()) {
			newy = origin.y + 10;
		} else if (coord == Moves.leste.ToString()){
			newx = origin.x + 10;
		} else if (coord == Moves.oeste.ToString()) {
			newx = origin.x - 10;
		}
		
		Debug.Log("newx: " +newx + " newy: " + newy);
		
		for (var r: Room in rooms) {
			
			Debug.Log(" -> " + r.name + " - " + r.status);
			
			if (r.x == newx && r.y == newy) {
				//if (r.requires == null) {
					room = r;
				//} else {
					
				//}
				//player.room = r;
				//drawBox(player.x,player.y,10,10,texturePlayer);	
				//playAudio(player.room);				
				break;
			}
		}
		//Debug.Log(player.room);
		return room;
	}		
	
	function UpdateRoomStatus(room : Room, status: String) : Room {
		for (var r: Room in rooms) {
			if (r == room) {
				r.status = status;
				return r;
			}
		}
		return null;
	}
}

class Room {
	var name : String;
	var width : int;
	var height : int;
	var description : String;
	var provides : String;
	var requires : String;
	var success : String;
	var audio : String;
	var image : String;
	var timer : int;
	var complete : String;
	
	var x : int;
	var y : int;
	var status : String = null;
}

class Player {
	var name : String;
	var room : Room;
	var lastroom : Room;
	var inventory: String;
	var networkplayer : NetworkPlayer;
}

@script RequireComponent(NetworkView)
