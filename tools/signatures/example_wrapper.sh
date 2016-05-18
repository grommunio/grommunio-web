#!/bin/bash
if [ -z $1 ];
then
        for user in $(kopano-admin -l | tail -n+5 | awk '{print $1}');
        do
             echo Running for $user
             python setdefaultsignature.py $user
        done
else
        for user in $(kopano-admin -l | tail -n+5 | grep $1 | awk '{print $1}');
        do
             echo Running for $user
             python setdefaultsignature.py $user
        done
fi
