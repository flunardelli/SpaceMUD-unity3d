var consoleData : String = "";

var inputData : String = "";
var remoteIP : String = "127.0.0.1";
var remotePort : String = "25000"; 
var scrollPosition : Vector2 = Vector2.zero;
var textureBackground : Texture2D;
var textureBackgroundBlack : Texture2D;
var terminalSkin : GUISkin;
var texturePlayer : Texture2D;
var textureRoom  : Texture2D;
	
var textureFactorX  = 6.5;
var textureFactorY  = 10;
static var windowWidth = 800;
static var windowHeight = 600;

var player : Player = new Player();
var style : GUIStyle = new GUIStyle();

var map : Map;

var status : GameStatus;

var viewID : NetworkViewID;

var numLines = 1;

var game : Game;

var currentPositionX : int;
var currentPositionY : int;

var windowRect : Rect;

var pass : String = "";
var login : String = "";

var mainColor : Color;

var colorRoom : Color;
var colorPlayer : Color;
var colorRoomClosed : Color;


var loginInvalid = false;

var timeOut : String;

var startTime = 99;
var textTime : String;

var gameOverText : String;

var completeText : String;

function Awake () {
	
}

function Start () {
	textureBackgroundBlack = Resources.Load("crt1", Texture2D);
	textureBackground = Resources.Load("crt2", Texture2D);
	
	terminalSkin = Resources.Load("Terminal");
	
	texturePlayer = Resources.Load("player", Texture2D);
 	textureRoom = Resources.Load("room", Texture2D);	
	
	gameOverText = Resources.Load("gameover", TextAsset).text;
	completeText = Resources.Load("complete", TextAsset).text;
	
	windowWidth = 800;
	windowHeight = 600;
	
	game = gameObject.GetComponent(Game);
	
	game.InitGame();
	
	map = game.map;
	
	player = new Player();

	mainColor = GUI.color;
	status = GameStatus.Disconnected;
	
	Debug.Log("GameStatus: "+status);
}

function LoginWindow (windowID : int) {
 	GUI.Label (Rect (10, 50, 100, 20), "Login");
	login = GUI.TextField (Rect (100, 50, 180, 20), login, 25);
	
	GUI.Label (Rect (10, 80, 100, 20), "Digite Senha");
	pass = GUI.PasswordField (Rect (100, 80, 180, 20), pass, 25);
	
	GUI.Label (Rect (10, 110, 100, 20), "Servidor");
	remoteIP = GUI.TextField (Rect (100, 110, 100, 20), remoteIP, 25);
	remotePort = GUI.TextField (Rect (210, 110, 70, 20), remotePort, 25);
	
    if (GUI.Button (Rect (180,150,100,20), "Conectar")){
    	if (login.Length >= 1){
    		Run(NetworkCmds.conectar.ToString() + " " + remoteIP + " " + remotePort);        	
        } else {
        	loginInvalid = true;
        }
    }
    
    if (loginInvalid){
    	GUI.color = new Color(255,0,0,1);
        GUI.Label (Rect (10, 170, 100, 20), "Login invalido");    
    }
  
   //GUI.FocusControl ("Login");
}

function OnGUI () {
	
	//DontDestroyOnLoad(this); 	
	 	
 	if (status == GameStatus.Disconnected) { 	
 		GUI.DrawTexture(Rect(0,0,900,562), textureBackgroundBlack);
		windowRect = Rect ((windowWidth/ 2) - 100, (windowHeight/ 2) - 100, 300, 200);
    	GUI.SetNextControlName("Login");
 		GUI.Window (0, windowRect, LoginWindow, "Terminal");
		GUI.color = new Color(255,255,255,0.3f);
		
	} else if (status == GameStatus.Connected) { 

		GUI.skin = terminalSkin;
		
		var guiTime : float = startTime - Time.time;
		
		if (guiTime <= 0){
			guiTime = 0;
		} 
		
	    var minutes : int = guiTime / 60f;
	    var seconds : int = (guiTime % 60f);
	    
	    timeOut = String.Format ("{0:00}:{1:00}", minutes, seconds);
		
		
		GUI.color = mainColor;
	    
		GUI.DrawTexture(Rect(0,0,900,562), textureBackground);
			    
		GUI.BeginGroup (Rect (80, 20, Client.windowWidth, Client.windowHeight));
		
			GUILayout.Space(10);
			
			var style : GUIStyle = new GUIStyle();
			
			style.fontSize = 40;
			style.normal.textColor = new Color(255,255,255,0.8f);
			//GUI.color = new Color(255,255,255,0.8f);
			GUI.Label(Rect (580, 60, 150, 60), timeOut, style);
			
			GUILayout.BeginVertical(GUILayout.Width(Client.windowWidth -10),GUILayout.Height(Client.windowHeight -300));
				GUILayout.Space(10);				
				
				drawMap();	
				
				var textHeight = style.CalcHeight(GUIContent(consoleData), Client.windowWidth);
				numLines = textHeight / style.lineHeight;
				
				scrollPosition = GUILayout.BeginScrollView (scrollPosition, GUILayout.Width (Client.windowWidth), GUILayout.Height ((windowWidth / 2) - 10));
					if (Event.current.type == EventType.keyDown && Event.current.character == "\n" && inputData.Length > 0){
						Run(inputData);
						Console(inputData);					
					}
					
					GUILayout.Label (consoleData);
						
				GUILayout.EndScrollView();	
	
				GUI.SetNextControlName("Input");
				inputData = GUILayout.TextField (inputData);
				
				GUILayout.BeginHorizontal ("box");
					
						
						GUI.FocusControl ("Input");
						
						GUILayout.BeginHorizontal ("box");
							if (GUILayout.Button ("<")){
								inputData = Moves.oeste.ToString(); 
							}
							GUILayout.BeginVertical("box");
								if (GUILayout.Button ("^")){
									inputData = Moves.norte.ToString(); 
								}
								if (GUILayout.Button ("v")){
									inputData = Moves.sul.ToString(); 
								}
							GUILayout.EndVertical();
							 
							if (GUILayout.Button (">")){
								inputData = Moves.leste.ToString(); 
							}
						GUILayout.EndHorizontal ();
					
					
						for (var s in System.Enum.GetValues(Cmds)){
							
							if (GUILayout.Button (s.ToString())){
								inputData = s.ToString(); 
							}
						}
					
				GUILayout.EndHorizontal ();		
			
			GUILayout.EndVertical();
			
			
		GUI.EndGroup();
	
	} else if (status == GameStatus.GameOver) {
		
		GUI.skin = terminalSkin;
		GUI.color = new Color(255,0,0,1);
		consoleData = gameOverText + "\n";	
		GUI.DrawTexture(Rect(0,0,900,562), textureBackgroundBlack);	
		
		GUILayout.BeginVertical(GUILayout.Width(Client.windowWidth+50),GUILayout.Height(Client.windowHeight -300));
		
			GUILayout.Space(180);
			GUILayout.Label (consoleData);	
		GUILayout.EndVertical();
	} else if (status == GameStatus.Complete) {
		
		GUI.skin = terminalSkin;
		//GUI.color = new Color(255,255,255,1);
		consoleData = completeText + "\n";	
		GUI.DrawTexture(Rect(0,0,900,562), textureBackgroundBlack);	
		
		GUILayout.BeginVertical(GUILayout.Width(Client.windowWidth+50),GUILayout.Height(Client.windowHeight -300));
		
			GUILayout.Space(50);
			GUILayout.Label (consoleData);	
		GUILayout.EndVertical();
	}	
	//GUI.color = mainColor;	
}

function Run(cmdline : String) {
	var cmds = cmdline.Split(" "[0]);	
	if (cmds.length >= 1 && cmds[0] == NetworkCmds.conectar.ToString() && status != GameStatus.Connected) {
		if (cmds.length >= 2 && cmds[1]) {
			remoteIP = cmds[1];
		}
		if (cmds.length >= 3 && cmds[2]) {
			remotePort = cmds[2];
		}
		Debug.Log("Connection " + remoteIP + " " + remotePort);
		Network.Connect(remoteIP, parseInt(remotePort));
		
						
	} else {
		Debug.Log("Sending to server " + cmdline);
		networkView.RPC("SendMsg", RPCMode.Server, cmdline);
	}
}

function OnConnectedToServer() {
	Debug.Log("Connected to server");
	status = GameStatus.Connected;
	Run(NetworkCmds.conectar.ToString()+ " " +login);
}

function OnDisconnectedFromServer () {
	Debug.Log('Disconnect');
	status = GameStatus.Disconnected;
}

var c : int = 0;
var cc : int = 0;
var cdata = new Array();
var dd : String;

function Console(data : String) {
	GUI.color = new Color(255,0,0,1);	
	
	consoleData += data + "\n";
	scrollPosition.y = 25 * numLines;
	inputData = "";					
}

function SetCurrentPosition(px,py) {
	currentPositionX = px;
	currentPositionY = py;
}

function SetRoomStatus(px,py,status) {
	for (var r: Room in map.rooms) {
		if (r.x == px && r.y == py){
			r.status = status;
		}
	}
	drawMap();
}

function SetTimer(time) {
	startTime = Time.time + parseInt(time);
}

function SetGameStatus(s) {
	status = s;
}

function drawMap() {

	colorRoom = new Color(0,0,0,0.2);
	colorPlayer = new Color(0,0,0,0.5);
	colorRoomClosed = new Color(255,0,0,0.2);
	
	if (currentPositionX && currentPositionY) {
		//Debug.Log("Drawing map x: " +currentPositionX + " y: " + currentPositionY);
		GUI.BeginGroup (Rect (125, -90, windowWidth, windowHeight));
			for (var r: Room in map.rooms) {				
				if (r.status == "open") {
					drawBox(r.x * textureFactorX,r.y * textureFactorY,10 * textureFactorX,10 * textureFactorY, textureRoom, colorRoom);	
				} else {				
					drawBox(r.x * textureFactorX,r.y * textureFactorY,10 * textureFactorX,10 * textureFactorY, textureRoom, colorRoomClosed);					
				}
			}
			drawBox(currentPositionX * textureFactorX,currentPositionY * textureFactorY,10 * textureFactorX,10 * textureFactorY,textureRoom, colorPlayer); 	
		GUI.EndGroup();
	}
}
	
function drawBox(x,y,w,h, texture :Texture2D, color : Color) {
	GUI.color = color;
	style.normal.background = texture;	
	GUI.Box(new Rect(x, y, w, h), new GUIContent(""), style);
	GUI.color = mainColor;
}
