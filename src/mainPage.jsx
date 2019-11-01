
import React, { Component } from "react";
import ReactDOM from "react-dom";

// Widgets used by this page
import { DateTimePicker, DropdownList } from 'react-widgets';
import ReactTable from "react-table";

// CSS for widgets
import "react-table/react-table.css";
import 'react-widgets/dist/css/react-widgets.css';


// Localization support...
import Globalize from 'globalize';
import globalizeLocalizer from 'react-widgets-globalize';

const devMode = false;

class MainPage extends React.Component {

      constructor(props) {
          super(props);

          // Setup the React "state" object used by this page...
          let now = new Date();
          this.state = {
            isLoaded: false,
            devices: null,
            currentDevice: null,
            data: null,
            error: null,
            startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            endDate: now
        };

        this.state.country = "US";
        this.state.locale = this.getLocale('en');

        this.setLocale(this.state.locale);

        if (devMode) {
            this.state.isLoaded = true;
            this.state.devices = ['device1', 'device2', 'device3'];          
        }

      }
    
      updateData() {
      }


      componentDidMount() {
        if (!devMode) {
          fetch("/plugins/signalk-hour-meter/api/devices")
            .then((res) => {
              return res.json()
            })
            .then(
              (data) => {
                this.setState({
                  isLoaded: true,
                  error: null,
                  devices: data,
                });
              },
              (error) => {
                this.setState({
                  isLoaded: true,
                  error,
                  devices: null
                });
              }
            )
        }      
      }
    

      componentWillUnmount() {
      }
  

      onFlagChange(country) {
        let locale = this.getLocale(country);
        this.setLocale(locale);
        this.setState({country, locale });
      }      

      getLocale(country) {
        console.log(`Country is ${country}`);
         if (country.indexOf('-') >= 0) {
          return country.substr(0,2);
         }
         else {
           return country.toLowerCase();
         }
      }


      setLocale(locale) {
        console.log(`Locale is ${locale}`);
        Globalize.locale(locale);
        globalizeLocalizer();
        this.formatNumber = Globalize.numberFormatter({ maximumFractionDigits: 2 });
        this.formatDate = Globalize.dateFormatter({ datetime: "short" });
      }

      getHours(secs) {
        return this.formatNumber(secs / 3600);
      }



      fetchHistory() {
        if (!devMode) {
          let sStart = this.state.startDate.toISOString();
          let sEnd = this.state.endDate.toISOString()
          fetch(`/plugins/signalk-hour-meter/api/history/${this.state.currentDevice}?start=${sStart}&end=${sEnd}`)
            .then((res) => {
              return res.json()
            })
            .then(
              (data) => {
                this.setState({
                  isLoaded: true,
                  error: null,
                  data,
                });
              },
              (error) => {
                this.setState({
                  isLoaded: true,
                  error,
                  data: null
                });
              }
          );

          this.setState({
              data: null
          });
        }
        else {
          // Mock data...
          this.setState({
            data: {
              totalRunTime: 217,
              historyRunTime: 217,
              history: [
                {
                start: "2019-10-29T21:09:35.122Z",
                end: "2019-10-29T21:12:12.529Z",
                runTime: 157
                },
                {
                start: "2019-10-29T21:15:59.224Z",
                end: "2019-10-29T21:16:59.211Z",
                runTime: 60
                }
              ]
            }
           });          
        }
      }


      render() {
        const { isLoaded, devices, currentDevice, data, error } = this.state;

        if (!isLoaded) {
          return <div>Waiting for response from server...</div>;
        }
        else if (error) {
          return <div>Error: {error.message}</div>;
        } 
        else {
          return (
            <div>

              <h1>Hour meter</h1>
              <div className="device section">
                <div className="formLabel">Device</div>
                <DropdownList 
                     data={devices}
                     value={currentDevice} 
                     onChange={ value => this.setState({currentDevice: value, data: null}) }
                     className="inlineRight devicePicker" />
              </div>

          { currentDevice &&
              <div className="history">

                  <div className="dateRange section">
                    <div className="formLabel">Show history from</div>
                    <DateTimePicker 
                        className="inlineRight datePicker"
                        value={this.state.startDate}
                        onChange= { value => this.setState({ startDate: value })} />
                    <div className="inlineRight formLabel">thru</div>
                    <DateTimePicker 
                        className="inlineRight datePicker"
                        value={this.state.endDate}
                        onChange= { value => this.setState({endDate: value})} />

                    <button className="inlineRight getButton" onClick={this.fetchHistory.bind(this)}>Get history</button>
                  </div>

             { data &&
                  <div className = "section results">
                     <div className = "section lifeStats">
                        <div className="formLabel">Life time hours:</div>
                        <div className="inlineRight">{this.getHours(data.totalRunTime)}</div>
                     </div>
                     <div className = "section grid">
                        <ReactTable
                          data={data.history}
                          columns={[
                                {
                                  Header: "Start",
                                  id: "start",
                                  accessor: h => this.formatDate(new Date(h.start))
                                },
                                {
                                  Header: "End",
                                  id: "end",
                                  accessor: h => this.formatDate(new Date(h.end))
                                },
                                {
                                  Header: "Run time",
                                  id: "runTime",
                                  accessor: h => this.getHours(h.runTime),
                                  className: 'colRunTime',
                                  Footer: (
                                    <div className="colTotal">
                                        <strong>Total</strong>
                                        <div className="inlineRight">{this.getHours(data.historyRunTime)}</div>
                                    </div>
                                  )
                                }
                              ]}
                          defaultPageSize={ (history.length > 20 ? 20 : history.length )}
                          className="-striped -highlight"
                        />
                     </div>
                  </div>
             }
              </div>
          }
            </div>
          );
        }
      }
}


let domContainer = document.querySelector('#mainBody');
ReactDOM.render(<MainPage />, domContainer);
