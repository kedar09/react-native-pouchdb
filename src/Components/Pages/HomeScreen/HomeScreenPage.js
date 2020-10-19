import React, {Component} from 'react';
import {View, Alert, ScrollView, LogBox} from 'react-native';
import * as yup from 'yup';
import {Formik} from 'formik';
// import { Input, Button } from 'react-native-elements';
import {DataTable, HelperText, TextInput, Button, Card} from 'react-native-paper';
import Icon from 'react-native-vector-icons/AntDesign';

import PouchDB from 'pouchdb-react-native'
const db = new PouchDB('mydb')

// const baseUrl = "http://172.17.0.1:3001/";

class HomeScreenPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            _id: '',
            name: '',
            address: '',
            isLoading: true,
            dataSource: [],
        };
    }

    componentDidMount() {
        LogBox.ignoreLogs(['Animated: `useNativeDriver`']);
        
        // db.destroy();
        return db.allDocs({
            include_docs: true,
            attachments: true
          }).then((response) =>  {
            //   console.log('hii');
            this.setState({
                isLoading: false,
                dataSource: response.rows,
            }, function () {
                // In this block you can do something with new state.
            });
          }).catch(function (err) {
            console.log(err);
          }); 
    }

    tableData() {
        return this.state.dataSource.map((res, index) => {
            const {doc} = res; //destructuring
            // console.log(doc)
            return (
                <DataTable.Row key={index}>
                    <DataTable.Cell>{doc.name}</DataTable.Cell>
                    <DataTable.Cell numeric>
                        <Button style={{marginRight: 20, alignItems: 'center', justifyContent: 'center'}}
                                onPress={index => this.selectData(doc._id, doc.name, doc.address)}>
                            <Icon name="edit" size={20}/>
                        </Button>
                    </DataTable.Cell>
                    <DataTable.Cell numeric>
                        <Button style={{alignItems: 'center', justifyContent: 'center'}}
                                onPress={index => this.deleteData(doc._id)}>
                            <Icon name="delete" size={20}/>
                        </Button>
                    </DataTable.Cell>
                </DataTable.Row>
            );
        });
    }

    deleteData(_id) {
        return db.get(_id).then(function(doc) {
            return db.remove(doc);
          }).then(function (result) {
            console.log(result);
            Alert.alert('Data Deleted Successfully!');
            this.refreshState();
            this.componentDidMount();
          }).catch(function (err) {
            console.log(err);
          });
    }

    selectData(_id, name, address) {
        console.log(_id, name, address);
        this.setState({
            _id: _id,
            name: name,
            address: address
        });
    }

    refreshState() {
        this.setState({
            _id: '',
            name: '',
            address: '',
        });
        this.componentDidMount();
    }

    render() {
        return (
            <View style={{
                flex: 1,
                alignItems: 'stretch',
                padding: 20,
            }}>
                <ScrollView>
                    <Card>
                        <Card.Title
                            title="User Information" />
                        <Card.Content>
                            <Formik
                                enableReinitialize={true}
                                initialValues={this.state}
                                onSubmit={values => {
                                     
                                    if(this.state._id==='') {
                                        let userData = {
                                            name: values.name,
                                            address: values.address,
                                        };
                                        db.post(userData).then(function (response) {
                                            console.log(response);
                                            Alert.alert('Data Added Successfully!');
                                            // handle response
                                        }).catch(function (err) {
                                            console.log(err);
                                        });
                                    } else {
                                        let userData = {
                                            _id: values._id,
                                            name: values.name,
                                            address: values.address,
                                        };
                                        db.get(userData._id).then(function (origDoc) {
                                            userData._rev = origDoc._rev;
                                            return db.put(userData).then(function (response) {
                                                console.log(response);
                                                Alert.alert('Data Updated Successfully!');
                                               // handle response
                                            }).catch(function (err) {
                                              console.log(err);
                                            });
                                          }).catch(function (err) {
                                            if (err.status === 409) {
                                              return retryUntilWritten(doc);
                                            } else { // new doc
                                              return db.put(doc);
                                            }
                                          });
                                          this.refreshState();
                                     }               
                                }}
                                validationSchema={yup.object().shape({
                                    name: yup
                                        .string()
                                        .required(),
                                    address: yup
                                        .string()
                                        .required()
                                })}
                            >
                                {({handleChange, handleBlur, touched, errors, handleSubmit, values}) => (
                                    <View>
                                        <View>
                                            <TextInput
                                                label="Name"
                                                onChangeText={handleChange('name')}
                                                onBlur={handleBlur('name')}
                                                value={values.name}
                                                mode='outlined'
                                                error={touched.name && errors.name ? true : false}
                                                // errorMessage={touched.name && errors.name ? errors.name : ''}
                                            />
                                            <HelperText type="error"
                                                        visible={touched.name && errors.name ? true : false}>
                                                {errors.name}
                                            </HelperText>
                                        </View>

                                        <View>
                                            <TextInput
                                                label="Address"
                                                onChangeText={handleChange('address')}
                                                onBlur={handleBlur('address')}
                                                mode='outlined'
                                                value={values.address}
                                                error={touched.address && errors.address ? true : false}
                                                // errorMessage={touched.address && errors.address ? errors.address : ''}
                                            />
                                            <HelperText type="error"
                                                        visible={touched.address && errors.address ? true : false}>
                                                {errors.address}
                                            </HelperText>
                                        </View>

                                        <Button onPress={handleSubmit} color='#3333ff' mode="contained">Save</Button>
                                        <Button style={{marginTop: 10}} color='#737373' onPress={()=>this.refreshState()} mode="contained">Cancel</Button>

                                    </View>
                                )}
                            </Formik>
                        </Card.Content>
                    </Card>
                    <Card style={{marginTop: 10}}>
                        <Card.Title
                            title="Users Details" />
                        <Card.Content>
                            <DataTable>
                                <DataTable.Header>
                                    <DataTable.Title>Name</DataTable.Title>
                                    <DataTable.Title numeric>Edit</DataTable.Title>
                                    <DataTable.Title numeric>Delete</DataTable.Title>
                                </DataTable.Header>

                                {this.tableData()}

                                {/*<DataTable.Pagination
                                    page={1}
                                    numberOfPages={3}
                                    onPageChange={page => {
                                        console.log(page);
                                    }}
                                    label="1-2 of 6"
                                />*/}
                            </DataTable>
                        </Card.Content>
                    </Card>
                </ScrollView>
            </View>
        );
    }
}

export default HomeScreenPage;
