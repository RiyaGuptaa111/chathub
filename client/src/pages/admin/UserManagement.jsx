import React, { useEffect, useState } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import Table  from "../../components/shared/Table.jsx"
import { Avatar, Skeleton } from '@mui/material';
import {transformImage} from "../../lib/features.js"
import { dashboardData } from '../../constants/sampleData.js';
import { useFetchData } from '6pp';
import { useErrors } from '../../hooks/hook.js';
import { server } from '../../constants/config.js';

const columns=[
    {
      field:"id",
      headerName:"ID",
      headerClassName:"table-header",
      width:200,
    },
    {
      field:"avatar",
      headerName:"Avatar",
      headerClassName:"table-header",
      width:150,
      //to take url from sampleData as params
      renderCell: (params)=>(
        <Avatar alt={params.row.name} src={params.row.avatar}/>
      ),
    },
    {
      field:"name",
      headerName:"Name",
      headerClassName:"table-header",
      width:200,
    },
    {
      field:"username",
      headerName:"Username",
      headerClassName:"table-header",
      width:200,
    },
    {
      field:"friends",
      headerName:"Friends",
      headerClassName:"table-header",
      width:150,
    },
    {
      field:"groups",
      headerName:"Groups",
      headerClassName:"table-header",
      width:150,
    },

];

const UserManagement = () => {
  const { loading, data, error } = useFetchData(
    `${server}/api/v1/admin/users`,
    "dashboard-users"
  );

useErrors([
{
  isError: error,
  error: error,
},
]);
console.log(data);


  const [rows,setRows]=useState([]);

  useEffect(()=>{
    if(data){
      setRows(
        data.users.map((i)=>({
          ...i,//to create an obj copy
          id:i._id,
          avatar:transformImage(i.avatar,50),
        })))
    }
  },[data]);
  return (
    <AdminLayout>
        {loading? (
          <Skeleton height={"100vh"}/>        ): (
          <Table heading={"All Users"} columns={columns} rows={rows}/>

        )}
    </AdminLayout>
  )
}

export default UserManagement
