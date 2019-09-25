package com.zarafa.jsconcat;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.apache.tools.ant.BuildException;
import org.apache.tools.ant.Task;
import org.apache.tools.ant.types.FileList;
import org.apache.tools.ant.types.FileSet;

public class JsConcatTask extends Task
{

	private ArrayList<FileSet> fileSets;
	private ArrayList<FileList> fileLists;
	private String destFile, prioritise = "";

	private boolean verbose = false;

	public JsConcatTask()
	{
		fileSets = new ArrayList<FileSet>();
		fileLists = new ArrayList<FileList>();
	}
	
	public List<String> collectFileNames()
	{
		ArrayList<String> fileNames = new ArrayList<String>();
		
		for (FileSet fileSet : fileSets)
		{
			File dir = fileSet.getDir(getProject());
			for (String fileName : fileSet.getDirectoryScanner(getProject()).getIncludedFiles())
				fileNames.add(dir + "/" + fileName);
		}
		
		for (FileList fileList : fileLists)
		{
			File dir = fileList.getDir(getProject());
			for (String fileName : fileList.getFiles(getProject()))
				fileNames.add(dir + "/" + fileName);
		}

		return fileNames;
	}
	
	public boolean checkFiles(List<String> fileNames)
	{
		File file;
		
		// Check date of the output file. If it doesn't exist, return true immediately.
		file = new File(destFile);
		if (!file.exists()) return true;
		long destLastModified = file.lastModified();
		
		// Check if any of the input files is newer than the destination file.
		for (String fileName : fileNames)
		{
			file = new File(fileName);
			if (file.exists() && file.lastModified()>destLastModified)
				return true;
		}
			
		// No input files are newer, return false.
		return false;
	}

	public void execute()
	{
		// Check that we have a destination file
		if (destFile==null || destFile.equals(""))
			throw new BuildException("'destfile' property not set.");
		
		List<String> files = collectFileNames();
		
		// Check if any of the input files is newer than the output file.
		if (!checkFiles(files))
		{
			this.log("Files are up to date");
			return;
		}
		
		Concatinator concat = new Concatinator();

		try {

			for (String fileName : files)
				concat.addFile(fileName);

			concat.sort(prioritise);
			
			if (verbose)
				concat.printStatus();
			
			concat.concat(destFile);
			
		} catch (FileNotFoundException ex)
		{
			System.out.println("File not found: " + ex.getMessage());
		} catch (IOException ex)
		{
			System.out.println("Generic IO exception: " + ex.getMessage());
		}

	}

	public void addFileset(FileSet fileSet)
	{
		fileSets.add(fileSet);
	}

	public void addFilelist(FileList fileList)
	{
		fileLists.add(fileList);
	}
	
	public void setVerbose(boolean verbose)
	{
		this.verbose = verbose;
	}
	
	public void setDestFile(String destFile)
	{
		this.destFile = destFile;
	}
	
	public void setPrioritize(String prioritise)
	{
		this.prioritise = prioritise;
	}
	
	public void setPrioritise(String prioritise)
	{
		this.prioritise = prioritise;
	}

}
