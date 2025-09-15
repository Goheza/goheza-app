

type IStations  = "AUTHENTICATION" | "BRAND-OPERATIONS" | "CREATOR-OPERATIONS" | "ADMIN-OPERATIONS"

export function baseLogger(station: IStations, record: string) {
    const stationStyle = "color: #3498db; font-weight: bold;";
    const recordStyle = "color: #2ecc71;";
    const labelStyle = "color: #95a5a6; font-weight: normal;";

    console.log(
        `%cSTATION:%c${station}\n%cRECORD:%c${record}`,
        labelStyle, stationStyle,
        labelStyle, recordStyle
    );
}

class LogsDetails {

    private _logDetails:Map<string,string[]> = new Map();


    record(station:IStations,record:string){
        if(this._logDetails.has(station)){
            this._logDetails.get(station)?.push(record)
        }else{
            this._logDetails.set(station,[])
        }
    };

    displayLogs(){
        this._logDetails.forEach((value,key)=>{
            console.log(`STATION:${key},LOGS:${value}`)
        })
    }   

};

export const LogsDetailsMain = new LogsDetails();