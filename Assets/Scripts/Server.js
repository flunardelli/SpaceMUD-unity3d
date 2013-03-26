//DontDestroyOnLoad(this);
var listenPort = "25000";
var remoteGUID = "";

private var connectionInfo = "";

Application.runInBackground = true;

var remoteMsg = "";

var consoleData = "";
var game : Game;

var status : GameStatus;

function Start () {	
	game = gameObject.GetComponent(Game);
	game.InitGame();
	status = GameStatus.Connected;
}

function OnGUI ()
{
	GUILayout.BeginHorizontal();
	GUILayout.Space(10);
	GUILayout.BeginVertical();
	GUILayout.Space(10);
	if (Network.peerType == NetworkPeerType.Disconnected)
	{
				
		GUILayout.BeginHorizontal();		
		
		if (GUILayout.Button ("Start Server", GUILayout.Width(100)))
		{
			Network.InitializeServer(32, parseInt(listenPort), false);			
		}
		GUILayout.Label("Port");
		listenPort = GUILayout.TextField(listenPort);
		GUILayout.EndHorizontal();
	}
	else
	{
		GUILayout.BeginHorizontal();
			GUILayout.Space(10);
			GUILayout.Label("Local IP/port: " + Network.player.ipAddress + "/" + Network.player.port);
			GUILayout.Label(" - External IP/port: " + Network.player.externalIP + "/" + Network.player.externalPort);				
		GUILayout.EndHorizontal();
			
		if (GUILayout.Button ("Disconnect", GUILayout.Width(100))) {
			Network.Disconnect(200);
			game.startTime = null;
			status = GameStatus.Disconnected;
			consoleData = "";
		}	
		
		GUILayout.Label (consoleData);		
				
	}
	GUILayout.FlexibleSpace();
	GUILayout.EndVertical();
	GUILayout.EndHorizontal();
}


function OnServerInitialized()
{
	Debug.Log("==> Local IP/port is " + Network.player.ipAddress + "/" + Network.player.port);
}

function Console(data : String) {
	
	consoleData += data + "\n";
}

function OnPlayerConnected(player: NetworkPlayer) {
    Console("Player Connected: " + player + " - "+player.ipAddress+":"+player.port);
}

function OnPlayerDisconnected(player: NetworkPlayer) {
    Console("Player Disconnected: " +  player);
    Network.RemoveRPCs(player);
    Network.DestroyPlayerObjects(player);
    game.removePlayer(player);
}

function Update() {
	if (game.startTime != null) {	
		var guiTime : float = game.startTime - Time.time;
		if (guiTime <= 0 && status == GameStatus.Connected){
			Debug.Log('Game over');
			status = GameStatus.GameOver;
			game.sendSetGameStatus(status);
		}
	}
}
