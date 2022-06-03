'''
Running this file will clear the current _staff/ directory and refill it using the staff.csv file
Each entry will create a new markdown file, named after the entry's lastName attribute
Verify that all values and column names can be handled by the site's code:
- If a member's 'department' is not in _data/departments.yml, the member will not appear on the site's staff directory.
- Feel free to add departments to _data/departments.yml, following the syntax already layed out
'''
import csv
import os

# get csv data as dicts
with open('staff.csv', 'r') as f:
    reader = csv.DictReader(f)
    members = [member for member in reader]

# navigate to _staff/
path_to_staff = f"{os.path.abspath(os.getcwd())}/_staff"
os.chdir(path_to_staff)

# clear all existing files in that dir
for file in os.listdir(path_to_staff):
    os.remove(file)

# repopulate with new data
for member in members:
    lines = ['---', 'layout: staff']
    for key, value in member.items(): # add each entry of the member's dict
        if value: # entry isn't empty
            lines.append(f"{key}: {value}")
    lines.append('---')

    filename = member['lastName'].lower().replace(' ', '') # make lowercase and remove spaces

    with open(f"{filename}.md", 'w') as out: # create and populate markdown file
        out.write('\n'.join(lines))

print(f"{len(members)} entries written")